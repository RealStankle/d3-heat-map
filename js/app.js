const tooltipContainer = document.getElementById('tooltip-container');
const tooltipWidth = 200;
const tooltipHeight = 100;
const tooltipDistanceConsonant = 20;
const tooltipDistanceRight = tooltipDistanceConsonant;
const tooltipDistanceLeft = -(tooltipWidth + tooltipDistanceConsonant);
const tooltipDistanceTop = -(tooltipHeight / 2);
const pagePadding = 20;

const setHorizontalDistance = (x) => {
  const { width: clientWidth } = document.body.getBoundingClientRect();

  if (x + tooltipDistanceRight + tooltipWidth + pagePadding > clientWidth) {
    return tooltipDistanceLeft;
  }

  return tooltipDistanceRight;
};

const formatTooltipText = (year, month, temperature, variance) => {
  const date = new Date();
  date.setMonth(month - 1);
  const fullMonth = date.toLocaleString('en-US', { month: 'long' });

  const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100;
  const roundedTemperature = round(temperature);
  const roundedVariance = round(variance);

  return `${year} - ${fullMonth}<br />${roundedTemperature}&#8451;<br />${roundedVariance}&#8451;`;
};

const drawTooltip = (event, data) => {
  const { clientX, clientY } = event;
  const distance = setHorizontalDistance(clientX);

  const tooltip = d3
    .create('div')
    .attr('id', 'tooltip')
    .attr('data-year', data.year)
    .style('top', `${clientY + tooltipDistanceTop}px`)
    .style('left', `${clientX + distance}px`)
    .join('p')
    .html(
      formatTooltipText(data.year, data.month, data.temperature, data.variance)
    );

  tooltipContainer.appendChild(tooltip.node());
};

const updateTooltipLocation = (event) => {
  d3.select('#tooltip').style('top', `${event.clientY + tooltipDistanceTop}px`);
};

const removeTooltip = () => {
  tooltipContainer.innerHTML = '';
};

const calculateTemperature = (baseTemperature, variance) => {
  return +(baseTemperature + variance).toFixed(12);
};

const drawChart = async () => {
  const { baseTemperature, monthlyVariance: dataset } = await d3.json(
    'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json'
  );

  const svgContainer = document.getElementById('svg-container');

  const { height: HEIGHT, width: WIDTH } = svgContainer.getBoundingClientRect();
  const TOP_PADDING = 50;
  const BOTTOM_PADDING = 130;
  const LEFT_PADDING = 120;
  const RIGHT_PADDING = 40;

  const svg = d3.create('svg').attr('width', WIDTH).attr('height', HEIGHT);

  const colors = [
    '#313695',
    '#4575b4',
    '#74add1',
    '#abd9e9',
    '#e0f3f8',
    '#ffffbf',
    '#fee090',
    '#fdae61',
    '#f46d43',
    '#d73027',
    '#a50026',
  ];

  const temperatures = dataset.map((data) =>
    calculateTemperature(baseTemperature, data.variance)
  );
  const [minTemperature, maxTemperature] = d3.extent(temperatures);

  const colorScale = d3
    .scaleLinear()
    .domain([minTemperature, maxTemperature])
    .rangeRound([0, (colors.length - 1) * 40]);

  const legendRectSideLength = ((colors.length - 1) * 40) / colors.length;
  const axisLegend = d3.axisBottom(colorScale);

  const xScale = d3
    .scaleBand()
    .domain(dataset.map((data) => data.year))
    .range([LEFT_PADDING, WIDTH - RIGHT_PADDING]);
  const yScale = d3
    .scaleBand()
    .domain([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    .range([TOP_PADDING, HEIGHT - BOTTOM_PADDING]);

  const axisLeft = d3.axisLeft(yScale).tickFormat((month) => {
    const date = new Date();
    date.setMonth(month - 1);
    return date.toLocaleDateString('en-US', { month: 'long' });
  });
  const axisBottom = d3
    .axisBottom(xScale)
    .tickValues(xScale.domain().filter((year) => year % 20 === 0));

  const cellWidth = xScale.bandwidth();
  const cellHeight = yScale.bandwidth();

  d3.select('#description').html(
    `${d3
      .extent(dataset, (data) => data.year)
      .join(' - ')}: base temperature ${baseTemperature}&#8451;`
  );

  svg
    .selectAll('rect')
    .data(dataset)
    .join('rect')
    .attr('class', 'cell')
    .attr('data-month', (data) => data.month - 1)
    .attr('data-year', (data) => data.year)
    .attr('data-temp', (data) =>
      calculateTemperature(baseTemperature, data.variance)
    )
    .style(
      'fill',
      (data) =>
        colors[
          Math.floor(
            colorScale(calculateTemperature(baseTemperature, data.variance)) /
              40
          )
        ]
    )
    .attr('width', cellWidth)
    .attr('height', cellHeight)
    .attr('x', (data) => xScale(data.year))
    .attr('y', (data) => yScale(data.month))
    .attr('shape-rendering', 'crispEdges')
    .on('mouseover', (event, data) => {
      data.temperature = calculateTemperature(baseTemperature, data.variance);
      drawTooltip(event, data);
    })
    .on('mousemove', (event) => updateTooltipLocation(event))
    .on('mouseout', () => removeTooltip());

  svg
    .append('g')
    .attr('id', 'x-axis')
    .attr('transform', `translate(0, ${HEIGHT - BOTTOM_PADDING})`)
    .call(axisBottom);
  svg
    .append('g')
    .attr('id', 'y-axis')
    .attr('transform', `translate(${LEFT_PADDING}, 0)`)
    .call(axisLeft);

  svg
    .append('g')
    .attr('id', 'legend')
    .attr('transform', `translate(${LEFT_PADDING}, ${HEIGHT - 50})`)
    .call(axisLegend)
    .selectAll('rect')
    .data(colors)
    .join('rect')
    .attr('width', legendRectSideLength)
    .attr('height', legendRectSideLength)
    .style('fill', (color) => color)
    .attr(
      'transform',
      (_, index) =>
        `translate(${legendRectSideLength * index}, -${legendRectSideLength})`
    );

  svgContainer.appendChild(svg.node());
};

drawChart();
