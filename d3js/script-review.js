/* global d3, _ */

(function() {

  var margin = {top: 30, right: 20, bottom: 100, left: 50},
    margin2  = {top: 410, right: 20, bottom: 20, left: 50},
    width    = 1800 - margin.left - margin.right,
    height   = 483 - margin.top - margin.bottom,
    height2  = 483 - margin2.top - margin2.bottom;

  d3.csv(`./data/review.csv`).then(function(data) {

    data.forEach(function(d) {
      d.sigma = +d.sigma;
    });

    var table = d3
                  .select("body")
                  .append("table")
                  .attr("style", "margin-left: 400px"),
        thead = table.append("thead"),
        tbody = table.append("tbody");

    thead
      .append("tr")
      .selectAll("th")
      .data(["ticker", "sigma"])
      .enter()
      .append("th")
        .text(function(c) { return c; });

    var rows = tbody
      .selectAll("tr")
      .data(data)
      .enter()
      .append("tr");

    var cells = rows
      .selectAll("td")
      .data(function(row) {
        return [
          {column: "ticker", value: row["ticker"]},
          {column: "sigma" , value: row["sigma"]}
        ]
      })
      .enter()
      .append("td")
        .attr("style", "font-family: Courier")
        .html(function(d) {
          if (d.column === "ticker") {
            return `<a href="${foobar(d.value)}" target="_blank">${d.value}</a>`;
            // <a href="localhost:8123/index?ticker=itx.mc" target="_blank">mco</a>
          } else {
            return d.value;
          }
        });
        //.html(function(d) { return d.value; });
  })

  function foobar(ticker) {
    const host = window.location.host;
    const protocol = window.location.protocol;
    return `${protocol}//${host}?ticker=${ticker}`;
  }

}());