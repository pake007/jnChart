# jnChart

jnChart is a jQuery plugin that can render simple chart, the current version is able to draw bars and lines in the chart. Especially, you can customize the hint text and style very easily, that's why I named this plugin jnChart (jQuery notable Chart).

## Installation

Using jnChart is very straightforward as using other jQuery plugins, you just need to include two javascript files and a css file.

``` html
<script src="excanvas.js" type="text/javascript"></script>
<script src="jnChart.js" type="text/javascript"></script>

<link href="jnChart.css" rel="stylesheet" type="text/css">
```
*Attention*: excanvas.js must be included before jnChart.js, because jnChart.js uses functions which defined in excanvas.js.

## Usage

If you want to render a chart in a particular div on your page, you just call function jnChart() on that div with some options, that's it!

For instance, you have following html snippet: 

```html
<body>
  <div id="dashboard"><div>
</body> 
```
And the js code render chart:

```javascript
$("#dashboard").jnChart({
  datas: [1,2,3,4,5,6]
});
```
Then refresh your page, you will see a chart with 6 bars !

### Draw bars

By default, the jnChart will render your data with vertical bars, you don't need to specify any other options, just like the code above.

### Draw lines

If you want to draw a broken line, you need to set the option **draw_lines: true**, if your only want to draw lines, also set the option **draw_bars: false**, otherwise it will render both lines and bars.

```javascript
$("#dashboard").jnChart({
  datas: [1,3,6,4,5,2],
  draw_lines: true,
  draw_bars: false
});
```





 