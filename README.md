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
  xs: 6,
  ys: 10,
  datas: [1,2,3,4,5,6]
});
```
Then refresh your page, you will see a chart with 6 bars !



 