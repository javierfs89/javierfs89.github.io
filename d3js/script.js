/* global d3, _ */

(function() {

  const urlParams = new URLSearchParams(window.location.search);
  var tickerParam = urlParams.get('ticker');
  var trParam = urlParams.get('tr');
  tickerParam = tickerParam === null ? "aapl" : tickerParam;
  trParam = trParam === null ? false : true;

  var margin = {top: 30, right: 20, bottom: 100, left: 50},
    margin2  = {top: 410, right: 20, bottom: 20, left: 50},
    width    = 1800 - margin.left - margin.right,
    height   = 483 - margin.top - margin.bottom,
    height2  = 483 - margin2.top - margin2.bottom;
//    width    = 764 - margin.left - margin.right,
//    height   = 283 - margin.top - margin.bottom,
//    height2  = 283 - margin2.top - margin2.bottom;

  // var parseDate = d3.timeFormat('%d/%m/%Y').parse,
  var parseDate = d3.timeFormat('%Y-%m-%d').parse,
    bisectDate = d3.bisector(function(d) { return d.date; }).left,
    legendFormat = d3.timeFormat('%b %d, %Y');

  var x = d3.scaleTime().range([0, width]),
    x2  = d3.scaleTime().range([0, width]),
    //y   = d3.scaleLinear().range([height, 0]),
    y   = d3.scaleLog().range([height, 0]),
    y1  = d3.scaleLinear().range([height, 0]),
    y2  = d3.scaleLinear().range([height2, 0]),
    y3  = d3.scaleLinear().range([60, 0]);

  var xAxis = d3.axisBottom().scale(x),
    xAxis2  = d3.axisBottom().scale(x2),
    yAxis   = d3.axisLeft().scale(y);

  var priceLine = d3.line()
    //.curve(d3.monotone)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.price); });

  var ma200Line = d3.line()
    //.curve(d3.monotone)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.ma200); });

// ma * (a-2*s)

//  var sigma2Line = d3.line()
//    //.curve(d3.monotone)
//    .x(function(d) { return x(d.date); })
//    .y(function(d) { return y(d.sigma2); });
//    //.y(function(d) { return y(d.ma200*(d.average+(2*d.sigma))); });
//    //.y(function(d) { return y(d.ma200+(d.sigma*2)); });

  var sigma1Line = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.sigma1); });

  var sigma1MLine = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.sigma1M); });

  var sigma3Line = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.sigma3); });

  var sigma3MLine = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.sigma3M); });

//  var sigma2MinusLine = d3.line()
//    //.curve(d3.monotone)
//    .x(function(d) { return x(d.date); })
//    //.y(function(d) { return y(d.ma200-(d.sigma*2)); });
//    //.y(function(d) { return y(d.ma200*(d.average-(2*d.sigma))); });
//    .y(function(d) { return y(d.sigma2M); });

  var avgLine = d3.line()
    //.curve(d3.monotone)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.average); });

  var sigma2MinusArea = d3.area()
    .x(function(d) { return x(d.date); })
    .y0(function(d) { return y(d.sigma2M); })
    .y1(function(d) { return y(d.ma200 * d.average); });

  var sigma2TopArea = d3.area()
    .x(function(d) { return x(d.date); })
    .y0(function(d) { return y(d.ma200 * d.average); })
    .y1(function(d) { return y(d.sigma2); });

  var area2 = d3.area()
    //.curve(d3.monotone)
    .x(function(d) { return x2(d.date); })
    .y0(height2)
    .y1(function(d) { return y2(d.price); });

  var svg = d3.select('body').append('svg')
    .attr('class', 'chart')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom + 60);

  svg.append('defs').append('clipPath')
    .attr('id', 'clip')
  .append('rect')
    .attr('width', width)
    .attr('height', height);

  var make_y_axis = function () {
    return d3.axisLeft()
      .scale(y)
      .ticks(3);
  };

  var focus = svg.append('g')
    .attr('class', 'focus')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

//  var barsGroup = svg.append('g')
//    .attr('class', 'volume')
//    .attr('clip-path', 'url(#clip)')
//    .attr('transform', 'translate(' + margin.left + ',' + (margin.top + 60 + 20) + ')');

  var context = svg.append('g')
    .attr('class', 'context')
    .attr('transform', 'translate(' + margin2.left + ',' + (margin2.top + 60) + ')');

  var legend = svg.append('g')
    .attr('class', 'chart__legend')
    .attr('width', width)
    .attr('height', 30)
    .attr('transform', 'translate(' + margin2.left + ', 10)');

  legend.append('text')
    .attr('class', 'chart__symbol')
    .text(`NASDAQ: ${tickerParam.toUpperCase()} ${trParam ? "TR" : ""}`)

  var rangeSelection =  legend
    .append('g')
    .attr('class', 'chart__range-selection')
    .attr('transform', 'translate(110, 0)');

  d3.csv(`./data/${tickerParam}-result-topic.csv`, type).then(function(data) {

    var brush = d3.brushX(x2)
      //.x(x2)
      .on('brush', brushed);

    var xRange = d3.extent(data.map(function(d) { return d.date; }));
    //var xRange = d3.extent(data, d => d.date);

    x.domain(xRange);
    y.domain([
      d3.min(data.map(function(d) { return (d.sigma > 0.0) ? d.sigma2M : d.price; })),
      d3.max(data.map(function(d) { return (d.sigma > 0.0) ? d.sigma2 : d.price; }))
    ]);
    y3.domain(d3.extent(data.map(function(d) { return d.price; })));
    x2.domain(x.domain());
    y2.domain(y.domain());

    var min = d3.min(data.map(function(d) { return d.price; }));
    var max = d3.max(data.map(function(d) { return d.price; }));

    var range = legend.append('text')
      .text(legendFormat(new Date(xRange[0])) + ' - ' + legendFormat(new Date(xRange[1])))
      .style('text-anchor', 'end')
      .attr('transform', 'translate(' + width + ', 0)');

    focus.append('g')
        .attr('class', 'y chart__grid')
        .call(make_y_axis()
        .tickSize(-width, 0, 0)
        .tickFormat(''));

//    var averageChart = focus.append('path')
//        .datum(data)
//        .attr('class', 'chart__line chart__average--focus line')
//        .attr('d', avgLine);

    var averageChart = focus.append('path')
        .data([data])
        .attr('class', 'chart__line chart__average--focus line')
        .attr('d', avgLine);

    var priceChart = focus.append('path')
        .datum(data)
        .attr('class', 'chart__line chart__price--focus line')
        .attr('d', priceLine);

    var ma200Chart = focus.append('path')
        .datum(data.filter(d => d.sigma > 0.0))
        .attr('class', 'chart__line chart__ma200--focus line')
        .attr('style', 'display: none;')
        .attr('d', ma200Line);

//    var sigma2Chart = focus.append('path')
//        .datum(data.filter(d => d.sigma > 0.0))
//        .attr('class', 'chart__line chart__ma200--focus line')
//        .attr('d', sigma2Line);

//    var sigma2MinusChart = focus.append('path')
//        .datum(data.filter(d => d.sigma > 0.0))
//        .attr('class', 'chart__line chart__ma200--focus line')
//        .attr('d', sigma2MinusLine);

    var sigma1Chart = focus.append('path')
        .datum(data.filter(d => d.sigma > 0.0))
        .attr('class', 'chart__line chart__sigma1--focus line')
        .attr('d', sigma1Line);

    var sigma1MinusChart = focus.append('path')
        .datum(data.filter(d => d.sigma > 0.0))
        .attr('class', 'chart__line chart__sigma1M--focus line')
        .attr('d', sigma1MLine);

    var sigma3Chart = focus.append('path')
        .datum(data.filter(d => d.sigma > 0.0))
        .attr('class', 'chart__line chart__sigma1--focus line')
        .attr('d', sigma3Line);

    var sigma3MinusChart = focus.append('path')
        .datum(data.filter(d => d.sigma > 0.0))
        .attr('class', 'chart__line chart__sigma1M--focus line')
        .attr('d', sigma3MLine);

    focus.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0 ,' + height + ')')
        .call(xAxis);

    focus.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(12, 0)')
        .call(yAxis);

//    var focusGraph = barsGroup.selectAll('rect')
//        .data(data)
//      .enter().append('rect')
//        .attr('class', 'chart__bars')
//        .attr('x', function(d, i) { return x(d.date); })
//        .attr('y', function(d) { return 155 - y3(d.price); })
//        .attr('width', 1)
//        .attr('height', function(d) { return y3(d.price); });

    var helper = focus.append('g')
      .attr('class', 'chart__helper')
      .style('text-anchor', 'end')
      .attr('transform', 'translate(' + width + ', 0)');

    var helperText = helper.append('text')

    var priceTooltip = focus.append('g')
      .attr('class', 'chart__tooltip--price')
      .append('circle')
      .style('display', 'none')
      .attr('r', 2.5);

    var averageTooltip = focus.append('g')
      .attr('class', 'chart__tooltip--average')
      .append('circle')
      .style('display', 'none')
      .attr('r', 2.5);

    var mouseArea = svg.append('g')
      .attr('class', 'chart__mouse')
      .append('rect')
      .attr('class', 'chart__overlay')
      .attr('width', width)
      .attr('height', height)
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .on('mouseover', function() {
        helper.style('display', null);
        priceTooltip.style('display', null);
        averageTooltip.style('display', null);
      })
      .on('mouseout', function() {
        helper.style('display', 'none');
        priceTooltip.style('display', 'none');
        averageTooltip.style('display', 'none');
      })
      .on('mousemove', mousemove);

    var sigma2TopChart = focus.insert('path',":first-child")
        .datum(data.filter(d => d.sigma > 0.0))
        .attr('class', 'chart__area__top area')
        .attr('d', sigma2TopArea);

    var sigma2MinusChart = focus.insert('path',":first-child")
        .datum(data.filter(d => d.sigma > 0.0))
        .attr('class', 'chart__area__minus area')
        .attr('d', sigma2MinusArea);

    context.append('path')
        .datum(data)
        .attr('class', 'chart__area area')
        .attr('d', area2);

    context.append('g')
        .attr('class', 'x axis chart__axis--context')
        .attr('y', 0)
        .attr('transform', 'translate(0,' + (height2 - 22) + ')')
        .call(xAxis2);

    context.append('g')
        .attr('class', 'x brush')
        .call(brush)
      .selectAll('rect')
        .attr('y', -6)
        .attr('height', height2 + 7);

    function mousemove(event) {
      // var x0 = x.invert(d3.mouse(this)[0]);
      var x0 = x.invert(d3.pointer(event)[0]);
      var i = bisectDate(data, x0, 1);
      var d0 = data[i - 1];
      var d1 = data[i];
      var d = x0 - d0.date > d1.date - x0 ? d1 : d0;
      helperText.text(legendFormat(new Date(d.date)) + ' - Price: ' + d.price + ' Avg: ' + d.average);
      priceTooltip.attr('transform', 'translate(' + x(d.date) + ',' + y(d.price) + ')');
      averageTooltip.attr('transform', 'translate(' + x(d.date) + ',' + y(d.average) + ')');
    }

    function brushed(event) {
      //var ext = brush.extent(b);
      var ext = event.selection.map(foo => x2.invert(foo));
      // if (!brush.empty()) {
      if (!(event.selection === null)) {
        x.domain(event.selection === null ? x2.domain() : ext);
        y.domain([
          d3.min(data.map(function(d) { return (d.date >= ext[0] && d.date <= ext[1]) ? d3.min([d.price, d.sigma2M]) : max; })),
          d3.max(data.map(function(d) { return (d.date >= ext[0] && d.date <= ext[1]) ? d3.max([d.price, d.sigma2]) : min; }))
        ]);
        range.text(legendFormat(new Date(ext[0])) + ' - ' + legendFormat(new Date(ext[1])))
        //focusGraph.attr('x', function(d, i) { return x(d.date); });

        var days = Math.ceil((ext[1] - ext[0]) / (24 * 3600 * 1000))
        //focusGraph.attr('width', (40 > days) ? (40 - days) * 5 / 6 : 5)
      }

      priceChart.attr('d', priceLine);
      ma200Chart.attr('d', ma200Line);

      sigma2MinusChart.attr('d', sigma2MinusArea);
      sigma2TopChart.attr('d', sigma2TopArea);
      //sigma2Chart.attr('d', sigma2Line);
      //sigma2MinusChart.attr('d', sigma2MinusLine);
      sigma1Chart.attr('d', sigma1Line);
      sigma1MinusChart.attr('d', sigma1MLine);
      sigma3Chart.attr('d', sigma3Line);
      sigma3MinusChart.attr('d', sigma3MLine);
      averageChart.attr('d', avgLine);
      focus.select('.x.axis').call(xAxis);
      focus.select('.y.axis').call(yAxis);
    }

    var dateRange = ['1w', '1m', '3m', '6m', '1y', '5y']
    for (var i = 0, l = dateRange.length; i < l; i ++) {
      var v = dateRange[i];
      rangeSelection
        .append('text')
        .attr('class', 'chart__range-selection')
        .text(v)
        .attr('transform', 'translate(' + (18 * i) + ', 0)')
        .on('click', function(d) { focusOnRange(this.textContent); });
    }

    function focusOnRange(range) {
      var today = new Date(data[data.length - 1].date)
      var ext = new Date(data[data.length - 1].date)

      if (range === '1m')
        ext.setMonth(ext.getMonth() - 1)

      if (range === '1w')
        ext.setDate(ext.getDate() - 7)

      if (range === '3m')
        ext.setMonth(ext.getMonth() - 3)

      if (range === '6m')
        ext.setMonth(ext.getMonth() - 6)

      if (range === '1y')
        ext.setFullYear(ext.getFullYear() - 1)

      if (range === '5y')
        ext.setFullYear(ext.getFullYear() - 5)

      brush.extent([ext, today])
      //brushed({selection: [ext, today]})
      brushed({selection: [x2(ext), x2(today)]})
      //context.select('g.x.brush').call(brush.extent([ext, today]))
      // TODO(jfuentes): falta actualizar el brush en la UI
      context.select('g.x.brush').call(brush.extent([ext, today]))
    }

  })// end Data

//  function type(d) {
//    return {
//      date    : parseDate(d.Date),
//      price   : +d.Close,
//      average : +d.Average,
//      volume : +d.Volume,
//    }
//  }

  function type(d) {
    if (trParam) {
      return {
        date    : d3.timeParse('%Y-%m-%d')(d.date),
        price   : +d.closeTR,
        average : +d.averageTR,
        volume  : +50,
        ma200   : +d.ma200TR,
        sigma   : +d.sigmaTR,
        sigma1  : +d.ma200TR*(+d.averageTR+(1*+d.sigmaTR)),
        sigma1M : +d.ma200TR*(+d.averageTR-(1*+d.sigmaTR)),
        sigma2  : +d.ma200TR*(+d.averageTR+(2*+d.sigmaTR)),
        sigma2M : +d.ma200TR*(+d.averageTR-(2*+d.sigmaTR)),
        sigma3  : +d.ma200TR*(+d.averageTR+(3*+d.sigmaTR)),
        sigma3M : +d.ma200TR*(+d.averageTR-(3*+d.sigmaTR))
      }
    } else {
      return {
        date    : d3.timeParse('%Y-%m-%d')(d.date),
        price   : +d.close,
        average : +d.average,
        volume  : +50,
        ma200   : +d.ma200,
        sigma   : +d.sigma,
        sigma1  : +d.ma200*(+d.average+(1*+d.sigma)),
        sigma1M : +d.ma200*(+d.average-(1*+d.sigma)),
        sigma2  : +d.ma200*(+d.average+(2*+d.sigma)),
        sigma2M : +d.ma200*(+d.average-(2*+d.sigma)),
        sigma3  : +d.ma200*(+d.average+(3*+d.sigma)),
        sigma3M : +d.ma200*(+d.average-(3*+d.sigma))
      }
    }
  }

}());