/*
jnChart 1.0.1
Requires jQuery version: >= 1.3
Requires excanvas library to handle IE canvas drawing (http://excanvas.sourceforge.net/)

Copyright (c) 2011 Jimmy Huang

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/


jnChart = (function($) {
  var defaults = {
    height: 250,
    datas: [],
    x_unit: "",
    x_start: 0,
    y_unit: "",
    y_start: 0,
    step: 1,
    highlight_zones: [],
    highlight_color: "red",
    highlight_text: "zone",
    has_note: true,
    note_datas: [],
    bartop: false,
    bartop_datas: [],
    bar_styles: [],
    note_styles: [],
    draw_bars: true,
    draw_lines: false,
    canvas_top_padding: 10,
    chart_top_padding: 30,
    line_width: 3,
    line_color: "#F79831",
    point_color: "#000000",
    hover_point_color: "#9FC31B"
  };

  function jnChart(el, opts) {
    if(typeof(opts) != "object") opts = {};
    $.extend(this, defaults, opts);

    this.div = $(el);
    el.jnChart_context = this;  // save the context into dom
    this.build();
  };

  jnChart.prototype = {
    build: function(){
      this.div.append("<div class='jnChart'><div class='jnChart-body'></div></div>");
      var $chartBd = this.div.find(".jnChart-body");
      this.chartBd = $chartBd;
      // set the height of chart
      $chartBd.css("height", this.height);

      var $chartCt = $('<div/>', {'class': 'jnChart-content'});
      this.chartCt = $chartCt;
      $chartBd.append($chartCt);
      
      this.adjustOptions();

      this.buildRows();
      // build ordinates
      this.buildXOrdinate();
      this.buildYOrdinate();
      
      // build canvas
      this.buildCanvas();

      // build vertical bars or points representing datas
      if(this.draw_bars) {
        this.buildBars();
        this.applyBarStyles();
        this.setBarsPosition();
      }
      if(this.draw_lines) {
        this.buildLines();
        this.setPointsPosition();
        this.drawCanvasLines();
      }

      // draw bar top span
      if(this.bartop) {
        this.setBartopPosition();
      }

      // build notes for bar or point
      this.buildNotes();
      this.applyNoteStyles();
      this.setNotePosition();

      // when hover on bar or point, show or hide corresponding note
      this.registerNoteShowEvent();

      // build warning scope if defined
      if(this.highlight_zones && (this.highlight_zones instanceof Array)) {
        this.addHighlightZones();
      }
    },
    
    // --------------------- adjust some options based on datas ------------------
    adjustOptions: function(){
      if(!this.xs){
        if(this.datas.length > 0){
          this.xs = this.datas.length;
        } else {
          this.xs = 7; // default value
        }
      }
      if(!this.ys){
        if(this.datas.length > 0){
          this.ys = parseInt(this.findMaxData(this.datas)/this.step)+1;
        } else {
          this.ys = 5; // default value
        }
      }
    },
    
    // --------------------- find maximun value in datas -------------------------
    findMaxData: function(datas){
      if(!datas || datas.length == 0) return null;
      var max;
      for(var i=0; i<datas.length; i++){
        if(!datas[i]) continue;
        if(!max || datas[i] > max) {
          max = datas[i];
        }
      }
      return max;
    },

    // --------------------------- build x ordinate ------------------------------
    buildXOrdinate: function(){
      var $x_ordinate = $('<div/>', {'class': 'jnChart_x_ordinate'});
      for(var xi=this.x_start; xi <= this.xs; xi++){
        var label;
        if(this.x_labels){
          label = this.x_labels[xi]
        } else {
          label = xi;
        }
        $x_ordinate.append("<div class='jnChart_x_tick'>" + label + "</div>");
      }
      $x_ordinate.append("<div class='jnChart_x_final'>" + this.x_unit + "</div>");

      // set the width of x-ordinate and x-unit
      var x_ordinate_width = this.chartCt.width();
      $x_ordinate.css("width", x_ordinate_width);
      var x_final_width = this.chartCt.width() * 0.05;
      var x_unit_width = (parseFloat(x_ordinate_width) - x_final_width) / (this.xs+1);
      $x_ordinate.find(".jnChart_x_final").css("width", x_final_width);
      $x_ordinate.find(".jnChart_x_tick").css("width", x_unit_width);

      this.chartBd.append($x_ordinate);
    },

    // --------------------------- build y ordinate ------------------------------
    buildYOrdinate: function(){
      var $y_ordinate = $('<div/>', {'class': 'jnChart_y_ordinate'});
      for(var yi=this.ys; yi >= 1; yi--){
        var label;
        if(this.y_labels){
          label = this.y_labels[yi-1]
        } else {
          label = (this.y_start+yi*this.step)
        }
        $y_ordinate.append("<div class='jnChart_y_tick'><span>" + label + "</span></div>");
      }
      if(this.y_start != 0) {
        $y_ordinate.append("<div class='jnChart_y_start'><span>" + this.y_start + "</span></div>");
      }
      $y_ordinate.append("<div class='jnChart_y_final'>" + this.y_unit + "</div>");

      // set and adjust the height of y-ordinate according to the total height of the chart
      var original_y_ordinate_height = this.div.height() * 0.8;
      var $chartBody = this.chartBd.closest(".jnChart-body");
      var $x_ordinate = this.chartBd.find(".jnChart_x_ordinate");
      var x_ordinate_height = $x_ordinate.outerHeight();
      var x_ordinate_from_bottom = parseInt($x_ordinate.css("bottom"));
      var top_space_height = $chartBody.outerHeight() - x_ordinate_height - x_ordinate_from_bottom - original_y_ordinate_height;
      if (top_space_height < this.chart_top_padding) {  // if the top space too narrow, adjust the chart height
        var new_y_ordinate_height = $chartBody.outerHeight() - x_ordinate_height - x_ordinate_from_bottom - this.chart_top_padding;
        $y_ordinate.css("height", new_y_ordinate_height);
        this.chartCt.css("height", new_y_ordinate_height);
      }

      // set the height of y unit and chart row
      var y_tick_height = this.chartCt.height() / this.ys;
      $y_ordinate.find(".jnChart_y_tick").css("height", y_tick_height);
      this.chartBd.find(".jnChart_row").css("height", y_tick_height - 1);  // minus the dotted border width

      this.chartBd.append($y_ordinate);
    },

    // ------------------------ append 2 canvas div (one for lines, one for hover points) -----------------------
    buildCanvas: function(){
      var canvas_width = this.chartCt.width();
      var canvas_height = this.chartCt.height()+this.canvas_top_padding;
      var canvas_ie_style = 'position:absolute;left:0;bottom:0;width:'+canvas_width+'px;height:'+canvas_height+'px';   // for IE

      $line_canvas = $('<canvas/>', {'class': 'jnChart_lineCanvas'});
      $hover_canvas = $('<canvas/>', {'class': 'jnChart_hoverCanvas'});
      this.chartCt.append($line_canvas).append($hover_canvas);
      this.chartCt.find("canvas").attr("width", canvas_width).attr("height", canvas_height); // add some top padding for canvas

      if(!$line_canvas[0].getContext) {   // for IE
        $line_canvas.attr("style", canvas_ie_style);
        $hover_canvas.attr("style", canvas_ie_style);
      }
    },

    // ------------------------ build chart rows ------------------------------
    buildRows: function(){
      // build chart row
      var $grid = $("<div/>", {'class': "jnChart_grid"});
      for(var yi=0; yi<this.ys; yi++){
        $grid.append("<div class='jnChart_row'></div>");
      }
      this.chartCt.append($grid);
    },

    // ----------------------- build warning scope ----------------------------
    addHighlightZones: function(){
      $highlight_zones = $("<div/>", {'class': "jnChart_zones"});
      for(var i=0; i<this.highlight_zones.length; i++){
        if(!this.highlight_zones[i]["from"] || !this.highlight_zones[i]["to"])
          continue;
          
        var $zone = $('<div/>', {
          'class': 'jnChart_zone',
          'data-start': this.highlight_zones[i]["from"],
          'data-end': this.highlight_zones[i]["to"]
        });
        $zone.append("<span>" + this.highlight_text + "</span>").appendTo($highlight_zones);

        // set the position of warning row
        var chart_height = this.chartCt.height();
        var chart_scope = parseFloat(this.ys * this.step);
        var chart_start = this.y_start;
        // set zone height
        var zone_scope = $zone.attr("data-end") - $zone.attr("data-start");
        var zone_height = (zone_scope / chart_scope) * chart_height;
        $zone.height(zone_height);
        // set zone position
        var zone_position = ($zone.attr("data-end") - chart_start) / chart_scope * chart_height;
        $zone.css("bottom", zone_position);
        // set zone color
        $zone.css("background-color", this.highlight_color).css("color", this.highlight_color);
        // set zone text position
        var $zone_span = $zone.find("span");
        $zone_span.css("top", ($zone.height()-parseInt($zone_span.css("font-size")))/2);
      }
      this.chartCt.append($highlight_zones);
    },

    // ---------------------- build bars representing datas --------------------
    buildBars: function(){
      var $bars = $("<div/>", {'class': "jnChart_bars"});
      for(var i=0; i<this.xs; i++) {
        var dataVal = this.datas[i];
        if(!dataVal) continue;
        var bar = $('<div/>', {
          'class': 'jnChart_bar',
          'data-index': i,
          'data-value': (dataVal-this.y_start)/this.step
        });
        var moreCss = this.bar_css ? ((this.bar_css instanceof Array) ? (bar_css[i] || "") : this.bar_css) : "jnChart_bar_general";
        bar.addClass(moreCss);
        // append bar top value
        if(this.bartop && this.bartop_datas[i]) {
          bar.append("<div class='jnChart_bartop'><span>" + this.bartop_datas[i] + "</span></div>");
        }
        $bars.append(bar);
      }
      this.chartCt.append($bars);
    },

    // --------------------- build lines representing data changes ---------------
    buildLines: function(){
      var $points = $("<div/>", {'class': "jnChart_points"});
      for(var i=0; i<this.xs; i++) {
        var dataVal = this.datas[i];
        if(!dataVal) continue;
        var point = $('<div/>', {
          'class': 'jnChart_point',
          'data-index': i,
          'data-value': (dataVal-this.y_start)/this.step
        });
        $points.append(point);
      }
      this.chartCt.append($points);
    },

    // -------------------- set data-value to bar to point ------------------------------
    assignDataValues: function(datas) {
      var chart = this;
      if(this.draw_bars){
        for(var i=0;i<this.xs;i++){
          var $bar = this.chartCt.find(".jnChart_bar[data-index=" + i + "]");
          $bar.attr("data-value", (datas[i]-chart.y_start)/chart.step);
        }
      }
      if(this.draw_lines){
        for(var i=0;i<this.xs;i++){
          var $point = this.chartCt.find(".jnChart_point[data-index=" + i + "]");
          $point.attr("data-value", (datas[i]-chart.y_start)/chart.step);
        }
      }
    },

    // -------------------- build notes for each data record --------------------------------
    buildNotes: function(){
      var $notes = $("<div/>", {'class': "jnChart_notes"});
      if(this.has_note && this.note_datas.length > 0) {
        for(var i=0; i<this.xs; i++) {
          if(this.datas[i] == null) continue;
          var $chart_note = $('<div/>', {
            'class': 'jnChart_note',
            'data-index': i,
            'style': 'display:none'
          });
          for(var j=0; j<this.note_datas.length; j++) {
            var $p = $('<p/>');
            var p_data = this.note_datas[j];
            var $p_span = $('<span/>', {'class': 'note_value'});

            this.fillNoteData($p_span, p_data, i);

            $p.append($p_span).appendTo($chart_note);
          }
          $chart_note.append("<span class='jnChart_note_arrow'></span>");   // add the note dialog arrow
          $notes.append($chart_note);
        }
      }
      this.chartCt.append($notes);
    },

    // ------------------ fill note with note datas ---------------------------------
    fillNoteData: function($el, data, index){
      if(typeof(data) == "string"){     // 1. a string, eg: "test note"
        $el.html(data);
      } else if(data instanceof Array){
        var formatter = null;
        if(data[0]){
          formatter = data[0].match(/%{s}/g);
        }
        if(!formatter) {    // 2. an array not including formatter, eg: ["a", "b", "c", "d", "e", "f"]
          $el.html(data[index]);
        } else {
          // 3. an array including formatter, the first element should be the formatter
          // eg: ["level: %{s}", [1.0, 1.0, 2.0, 2.0, 2.0, 3.0]] or ["day %{s}, week %{s}", [1,8,15,23,30,37], [1,2,3,4,5,6]]
          // or ["max %{s}": 120]
          var formatted_str = data[0];
          for(var k=1; k<=formatter.length; k++){
            if(data[k]) {
              var value;
              if(typeof(data[k]) == "string"){
                value = data[k];
              } else {
                value = data[k][index];
              }
              formatted_str = formatted_str.replace(/%{s}/, value);
            }
          }
          $el.html(formatted_str);
        }
      }
    },

    // ------------------ set left and height for each bar ------------------------------
    setBarsPosition: function(){
      var chart = this;

      this.getBarRecords().each(function(){
        var position = chart.calculateRecordPosition($(this));
        $(this).height(position["height"]);
        $(this).css('left', position["left"]);
      });
    },

    // ------------------ set left and bottom position for each point ---------------------
    setPointsPosition: function(){
      var chart = this;
      // position array for canvas points
      this.canvasPoints = [];

      var canvas_height = chart.chartCt.find(".jnChart_lineCanvas").height();
      var $points = this.getPointRecords();
      var point_width = parseInt($points.css("width"));
      var point_height = parseInt($points.css("height"));

      $points.each(function(){
        var position = chart.calculateRecordPosition($(this));
        $(this).css("top", canvas_height - position["height"] - point_height/2 - chart.canvas_top_padding);
        $(this).css("left", position["left"] - point_width/2);
        // save canvas points position to be used for drawing canvas lines
        if(position["height"] >= 0) {
          chart.canvasPoints.push({y: canvas_height - position["height"], x: position["left"], index: $(this).attr("data-index")});
        }
      });
    },

    // ------------------ calculate height and left position of a record ---------------------------
    calculateRecordPosition: function(record) {
      var position = {};

      var y_tick_height = this.chartBd.find(".jnChart_y_tick").height();
      var x_tick_width = this.chartBd.find(".jnChart_x_tick").width();
      if(record.attr("data-value") < 0){
        position["height"] = 0;
      } else {
        position["height"] = parseFloat(record.attr("data-value"))*y_tick_height;
      }

      // set width, for point is 0, for bar is half of the bar width
      var record_width = 0;
      if(record.hasClass("jnChart_bar")) {
        record_width = record.width();
      }
      // calculate left of start point
      var start_left;
      if(this.from_zero) {
        start_left = -record_width/2.0;
      } else {
        start_left = x_tick_width - record_width/2.0;
      }
      position["left"] = start_left + parseInt(record.attr("data-index")) * x_tick_width;

      return position;
    },

    // --------------------- draw canvas lines based on the canvas points ---------------------------
    drawCanvasLines: function(){
      // find line canvas and hover canvas
      var $canvas = this.chartCt.find(".jnChart_lineCanvas");
      var $hoverCanvas = this.chartCt.find(".jnChart_hoverCanvas");

      // get canvas context and draw lines
      var canvas = $canvas[0];
      var hover_canvas = $hoverCanvas[0];
      var canvasPoints = this.canvasPoints;

      // if can't user canvas (IE)
      if(!(canvas && canvas.getContext && hover_canvas && hover_canvas.getContext)){
        if(G_vmlCanvasManager){
          G_vmlCanvasManager.initElement(canvas);
          G_vmlCanvasManager.initElement(hover_canvas);
        }
      }
      var ctx = canvas.getContext('2d');
      var hctx = hover_canvas.getContext('2d');

      // clear canvas first
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      hctx.clearRect(0, 0, hctx.canvas.width, hctx.canvas.height);

      ctx.lineWidth = this.line_width;    // set line width, can be customized
      ctx.strokeStyle = this.line_color;   // set line color, can be customized
      ctx.fillStyle = this.point_color;  // set fill color, can be customized

      hctx.lineWidth = this.line_width;;
      hctx.strokeStyle = this.point_color;
      hctx.fillStyle = this.hover_point_color;

      for(var i=0; i<canvasPoints.length; i++) {
        var currentX = canvasPoints[i]["x"];
        var currentY = canvasPoints[i]["y"];
        // draw line
        if(i != canvasPoints.length-1) {
          var nextX = canvasPoints[i+1]["x"];
          var nextY = canvasPoints[i+1]["y"];
          ctx.beginPath();
          ctx.moveTo(currentX, currentY);
          ctx.lineTo(nextX, nextY);
          ctx.closePath();
          ctx.stroke();
        }
        // draw point
        ctx.beginPath();
        ctx.arc(currentX, currentY, 4, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
      }
      
      var chart = this;
      // unbind old event first
      this.chartCt.find(".jnChart_point").unbind("mouseenter.point").unbind("mouseleave.point");
      // bind hover event to canvas point div
      this.chartCt.find(".jnChart_point").bind("mouseenter.point", function(event){
        // draw hover point
        var index = $(this).attr("data-index");
        var canvas_point = chart.findCanvasPoint(canvasPoints, index);
        var x = canvas_point["x"];
        var y = canvas_point["y"];
        // inner round
        hctx.beginPath();
        hctx.arc(x, y, 5, 0, Math.PI*2, true);
        hctx.closePath();
        hctx.fill();
        // outer circle
        hctx.beginPath();
        hctx.arc(x, y, 6, 0, Math.PI*2, true);
        hctx.closePath();
        hctx.stroke();
      }).bind("mouseleave.point", function(event){
        hctx.clearRect(0, 0, hctx.canvas.width, hctx.canvas.height)
      });
    },
    
    findCanvasPoint: function(points, index){
      for(var i=0; i<points.length; i++){
        if(points[i]["index"] == index)
          return points[i];
      }
    },

    // ----------------------- set the bar top span position --------------------------------
    setBartopPosition: function(){
      var chart = this;
      chart.chartCt.find(".jnChart_bartop").each(function(){
        var bar_width = parseInt($(this).closest(".jnChart_bar").css("width"));
        var left = (bar_width - $(this).width()) / 2;
        $(this).css("left", left).css("top", -($(this).height()+5));
      });
    },

    // ------------------------ set absolute position for each note -------------------------
    setNotePosition: function(){
      var chart = this;
      var notes = this.chartCt.find(".jnChart_note");
      var notes_margin = 15;   // the margin between note and bar (point)

      notes.each(function(){
        // get corresponding bar or point top position
        if(chart.draw_bars) {
          var record = chart.chartCt.find(".jnChart_bar[data-index=" + $(this).attr("data-index") + "]");
          var bartop_height = (- parseInt(record.find(".jnChart_bartop").css("top"))) || 0;
          var record_top = record.height() + bartop_height;
        } else if(chart.draw_lines) {
          var record = chart.chartCt.find(".jnChart_point[data-index=" + $(this).attr("data-index") + "]");
          var record_top = chart.chartCt.height() - parseInt(record.css("top"));
        }
        var record_left = parseInt(record.css("left")) + record.width()/2 - $(this).outerWidth()/2;

        $(this).css("bottom", record_top + notes_margin).css("left", record_left);
      });
    },

    // ----------------------- register note show/hide event -------------------------------
    registerNoteShowEvent: function(){
      var chart = this;
      var $records = $.merge(chart.getBarRecords(), chart.getPointRecords());
      $records.each(function(){
        var index = $(this).attr("data-index");
        var $note = chart.chartCt.find(".jnChart_note[data-index=" + index + "]");
        $(this).bind("mouseenter.note", function(){
          $note.show();
          if($(this).hasClass("jnChart_point")){
            $(".jnChart_hoverCanvas").css("z-index", 101);
          }
        }).bind("mouseleave.note", function(){
          $note.hide();
          if($(this).hasClass("jnChart_point")){
            $(".jnChart_hoverCanvas").css("z-index", 99);
          }
        });
      });
    },

    // -------------------------- set bar styles ----------------------------------
    applyBarStyles: function(){
      var styles = this.bar_styles;
      this.getBarRecords().each(function(){
        if(typeof(styles) == "string")
          $(this).addClass(styles);
        else
          $(this).addClass(styles[$(this).attr("data-index")]);
      });
    },

    // ------------------------- set note font styles -----------------------------
    applyNoteStyles: function(){
      var chart = this;
      if(chart.note_styles){
        var $notes = chart.chartCt.find(".jnChart_note");
        for(var i=0; i<chart.note_styles.length; i++){
          var p_index = chart.note_styles[i]["line"];
          $notes.each(function(){
            var $span = $($(this).find("p")[p_index]).find("span");
            if(chart.note_styles[i]["style"]) {
              $span.attr("style", chart.note_styles[i]["style"]);
            }
            if(chart.note_styles[i]["css"]){
              $span.addClass(chart.note_styles[i]["css"]);
            }
          });
        }
      }
    },

    // get bar elements
    getBarRecords: function(){
      return this.chartCt.find(".jnChart_bar");
    },

    // get point elements
    getPointRecords: function(){
      return this.chartCt.find(".jnChart_point");
    }
  };

  // --------------------- render a jnChart ----------------------------
  $.fn.jnChart = function(opts) {
    return this.each(function() { new jnChart(this, opts); });
  };

  // --------------------- update chart datas without re-drawing chart ------------------
  jnChart.updateDatas = function(chartId, datas) {
    var context = $("#"+chartId)[0].jnChart_context;
    if(!context) return false;

    var $chart = $("#"+chartId).find(".jnChart");
    var y_tick_height = $chart.find(".jnChart_y_tick").height();
    var y_start = context.y_start;
    var step = context.step;

    // assign new datas to bars or points
    datas = datas || [];
    context.assignDataValues(datas);

    // update the chart bar height and note info
    if(context.draw_bars) {
      context.setBarsPosition();
    }
    // update the chart points and re-draw the canvas lines, TODO more
    if(context.draw_lines) {
      context.setPointsPosition();
      context.drawCanvasLines();
    }
  };

  // ---------------------- update chart bar styles without re-drawing chart ---------------------------
  jnChart.updateBarStyles = function(chartId, styles) {
    var $chart = $("#"+chartId).find(".jnChart");
    var bars = $chart.find(".jnChart_bar");
    styles = styles || []
    for(var i=0; i < bars.length; i++) {
      $(bars[i]).attr("class", "jnChart_bar " + styles[i]);
    }
  };

  // ---------------------- update chart notes without re-drawing chart ------------------------------
  jnChart.updateNotes = function(chartId, note_datas) {
    var context = $("#"+chartId)[0].jnChart_context;
    if(!context) return false;

    // reset the position$p_span
    context.setNotePosition();

    // replace the note text
    var notes = $("#"+chartId).find(".jnChart_note");
    note_datas = note_datas || [];
    for(var i=0; i < notes.length; i++) {
      for(var j=0; j < note_datas.length; j++) {
        if(note_datas[j] == null) continue;
        var $p_span = $($(notes[i]).find("p")[j]).find("span.note_value");
        context.fillNoteData($p_span, note_datas[j], $(notes[i]).attr("data-index"));
      }
    }
  };

  // ---------------------- update bar top values --------------------------
  jnChart.updateBartopDatas = function(chartId, top_datas) {
    var $chart = $("#"+chartId).find(".jnChart");
    var bars = $chart.find(".jnChart_bar");
    top_datas = top_datas || [];

    for(var i=0; i < bars.length; i++) {
      $(bars[i]).find(".jnChart_bartop").removeClass("hidden");
      if(top_datas[i] != undefined && top_datas[i] != "") {
        $(bars[i]).find(".jnChart_bartop span").text(top_datas[i]);
      } else {
        $(bars[i]).find(".jnChart_bartop").addClass("hidden");
      }
    }
  };

  return jnChart;
})(jQuery);

