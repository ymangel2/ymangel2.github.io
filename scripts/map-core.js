// GLOBAL VARIABLES

const width = 975;
const height = 590;

// Define mapping from fips code of state to 2 letter state code.
// this is necessary because the population data uses 2 letter state code,
// while the topoJSON data for the U.S. map uses state fips code.

//prettier-ignore
const fipsToStateCode = { 
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
};

// define slides
export const yearRanges = {
  slide0: {
    START_YEAR: 1900,
    END_YEAR: 2024,
    label: "U.S. State Population: A Historical Exploration (1900-2024)",
    colorDomain: [0, 0, 10],
  },
  slide1: {
    START_YEAR: 1930,
    END_YEAR: 1938,
    label: "Dust Bowl Disaster (1930-1938)",
    colorDomain: [-0.05, 0, 0.25],
  },
  slide2: {
    START_YEAR: 1939,
    END_YEAR: 1945,
    label: "WWII Migration (1939-1945)",
    colorDomain: [-0.15, 0, 0.5],
  },
  slide3: {
    START_YEAR: 2020,
    END_YEAR: 2022,
    label: "COVID-19 Shift (2020-2022)",
    colorDomain: [-0.02, 0, 0.1],
  },
  slide4: {
    START_YEAR: 1900,
    END_YEAR: 2024,
    label: "The End",
    colorDomain: [0, 0, 10],
  },
};

// MAIN MAP CODE

let svg,
  path,
  usData,
  popByState = {};

// render map projection
export async function initMap() {
  svg = d3.select("svg").attr("width", width).attr("height", height);
  const projection = d3
    .geoAlbersUsa()
    .translate([width / 2 + 125, height / 2 - 70]) // play around w/ these values to resize map
    .scale(1000);
  path = d3.geoPath(projection);

  // load the population data into popByState structure
  const csvText = await d3.text(
    "https://raw.githubusercontent.com/JoshData/historical-state-population-csv/primary/historical_state_population_by_year.csv"
  );
  const csvRows = d3.csvParseRows(csvText);
  const pop_data = csvRows.map((row) => ({
    state: row[0],
    year: +row[1],
    population: +row[2],
  }));

  pop_data.forEach(({ state, year, population }) => {
    if (!state || isNaN(year) || isNaN(population)) return;
    if (!popByState[state]) popByState[state] = {};
    popByState[state][year] = population;
  });

  // load topoJSON U.S. map data. Uses the state only version (no counties)
  usData = await d3.json(
    "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"
  );
}

// fill in map based on slide # and population data
export function updateMap(yearRange) {
  // change start + end year based on slide # (controlled in main.js)
  const { START_YEAR, END_YEAR } = yearRange;

  // color scale for states
  const colorScale = d3
    .scaleDiverging()
    .domain(yearRange.colorDomain)
    .interpolator(d3.interpolateRdYlGn);
  const percentChangeByState = {};

  // edge case: some states don't have data b/w 1900-1950
  const actual_start_year =
    START_YEAR < 1950 && END_YEAR >= 1950 ? 1950 : START_YEAR;

  // calculate % pop change for each state based on data
  for (const state in popByState) {
    const start = popByState[state][actual_start_year];
    const end = popByState[state][END_YEAR];

    if (start !== undefined && end !== undefined && start !== 0) {
      percentChangeByState[state] = (end - start) / start;
    }
  }

  // draw map!!

  // remove previous
  svg.selectAll(".state").remove();
  svg.selectAll(".nation").remove();
  svg.selectAll("path").remove();

  const tooltip = d3.select("#tooltip");

  //fill in states
  const states = topojson.feature(usData, usData.objects.states).features;

  svg
    .selectAll("path.state")
    .data(states)
    .enter()
    .append("path")
    .attr("class", "state")
    .attr("d", path)
    .attr("fill", (d) => {
      const fips = d.id.toString().padStart(2, "0");
      const stateCode = fipsToStateCode[fips];
      const change = percentChangeByState[stateCode];
      return change !== undefined ? colorScale(change) : "#ccc";
    })
    .attr("stroke", "#000")
    .attr("stroke-width", 0.5)
    .attr("d", path)

    // fill in tooltip
    .on("mouseover", function (d, i) {
      const fips = d.id.toString().padStart(2, "0");
      const stateCode = fipsToStateCode[fips];

      const startPop = popByState[stateCode]?.[actual_start_year];
      const endPop = popByState[stateCode]?.[END_YEAR];
      const percentChange = percentChangeByState[stateCode];

      if (startPop && endPop) {
        tooltip.style("display", "block").html(`
        <strong>${stateCode}</strong><br/>
        ${actual_start_year}: ${startPop.toLocaleString()}<br/>
        ${END_YEAR}: ${endPop.toLocaleString()}<br/>
        Change: ${(percentChange * 100).toFixed(1)}%
      `);
      } else {
        tooltip.style("display", "none");
      }
    })
    .on("mousemove", function () {
      tooltip
        .style("left", d3.event.pageX + 15 + "px")
        .style("top", d3.event.pageY + 15 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("display", "none");
    });

  svg
    // fill in map outlines
    .append("path")
    .datum(topojson.mesh(usData, usData.objects.nation))
    .attr("class", "nation")
    .attr("fill", "none")
    .attr("stroke", "#000")
    .attr("stroke-width", 1)
    .attr("d", path);

  // fill in legend
  renderLegend(yearRange.colorDomain, colorScale);

  // fill in annotations
  renderAnnotations(yearRange);
}

function renderLegend(domain, colorScale) {
  const [min, mid, max] = domain;
  const legendWidth = 300;
  const legendHeight = 10;

  // clear existing legend
  svg.selectAll(".legend").remove();
  let defs = svg.select("defs");
  if (defs.empty()) defs = svg.append("defs");

  const gradientId = "legend-gradient";
  defs.select(`#${gradientId}`).remove();

  const gradient = defs
    .append("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0%")
    .attr("x2", "100%");

  // compute relative stop positions for diverging color scale
  const midOffset = (0 - min) / (max - min);

  gradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", colorScale(min));

  gradient
    .append("stop")
    .attr("offset", `${midOffset * 100}%`)
    .attr("stop-color", colorScale(mid));

  gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", colorScale(max));

  // draw the legend
  const legendGroup = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(20, ${height - 90})`);

  legendGroup
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", `url(#${gradientId})`)
    .attr("stroke", "#000");

  const legendScale = d3
    .scaleLinear()
    .domain([min, max])
    .range([0, legendWidth]);

  const legendAxis = d3
    .axisBottom(legendScale)
    .tickValues([min, 0, max])
    .tickFormat(d3.format(".0%"));

  legendGroup
    .append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);
}

function renderAnnotations(yearRange) {
  // remove previous annotations
  svg.selectAll(".annotation-group").remove();

  let annotations = [];

  switch (
    yearRange // determinate annotation based on slide #
  ) {
    case yearRanges.slide0:
      annotations = [
        {
          note: {
            title: "Welcome!",
            label:
              "Hello and welcome to my CS416 Final Project! In this interactive slideshow, I will be guiding you through an exploration of how various historical events influenced the population of U.S. States.",
            wrap: 200,
            padding: 5,
          },
          x: 275,
          y: 20,
          dx: -70,
          dy: 0,
        },
        {
          note: {
            label:
              'While some events had more regional impact, others impacted the entire country! Use the colors to draw your own conclusions, and hover over states to see the actual numbers. Click the "play" button to begin!',
            wrap: 200,
            padding: 5,
          },
          x: 260,
          y: 220,
          dx: -70,
          dy: 0,
        },
      ];
      break;

    case yearRanges.slide1:
      annotations = [
        {
          note: {
            title: "Regional Impact: The Dust Bowl Migration",
            label:
              "During the 1930s, severe drought and relentless dust storms devastated farmlands across Oklahoma, Kansas, and other central U.S. states. The environmental catastrophe, known as the Dust Bowl, made agriculture nearly impossible and forced hundreds of thousands of families to abandon their homes in search of work and more livable conditions, particularly in the West.",
            wrap: 200,
            padding: 5,
          },
          x: 550,
          y: 75,
          dx: -325,
          dy: 0,
        },
      ];
      break;

    case yearRanges.slide2:
      annotations = [
        {
          note: {
            title: "National Impact: WWII Industrial Shift",
            label:
              "World War II led to major population shifts across the United States. Enlistment caused population declines in many rural and southern states, as large numbers of men left to join the military. At the same time, states with growing defense industries, such as Florida and California, saw significant population increases. These regions became centers of wartime manufacturing, drawing workers from across the country and reshaping the U.S. population landscape during the 1940s.",
            wrap: 220,
            padding: 5,
          },
          x: 0,
          y: 0,
          dx: 25,
          dy: 0,
        },
      ];
      break;

    case yearRanges.slide3:
      annotations = [
        {
          note: {
            title: "Modern Impact: Pandemic Pandemonium",
            label:
              "Unlike typical periods of economic growth marked by steady population increases, the COVID-19 pandemic caused uneven population declines across some U.S. states. While some areas saw scattered decreases, others remained stagnant. This disruption reflected broader failures in economic and medical infrastructure, as overwhelmed healthcare systems and job losses drove people to relocate (or stay put) in unpredictable ways.",
            wrap: 220,
            padding: 5,
          },
          x: 0,
          y: 0,
          dx: 25,
          dy: 0,
        },
      ];
      break;
    case yearRanges.slide4:
      annotations = [
        {
          note: {
            title: "Thank you for visiting!",
            label:
              "This ends our exploration of U.S. state population changes over time. Behind every shift, whether driven by drought, war, industry, or crisis, are stories of movement, resilience, and adaptation. By examining these patterns, we don’t just learn about the past; we gain tools to understand the present and anticipate the future of our communities, economies, and environment.",
            wrap: 220,
            padding: 5,
          },
          x: 0,
          y: 0,
          dx: 25,
          dy: 0,
        },
      ];
      break;
  }

  // render annotations
  if (annotations.length > 0) {
    const makeAnnotations = d3.annotation().annotations(annotations);
    svg.append("g").attr("class", "annotation-group").call(makeAnnotations);
  }
}
