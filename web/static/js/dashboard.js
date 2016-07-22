/**
 * Created by nlrc on 22-7-16.
 */

     $(document).ready(function () {


            var zoneChart = dc.pieChart('#chart-ring-zone')
            var crisisChart = dc.pieChart('#chart-ring-crisis')
            var climateChart = dc.pieChart('#chart-ring-climate')
            var timeChart = dc.barChart('#chart-timeline');
            var countryChart = dc.rowChart('#chart-bar-country')
            var mapChart = dc_leaflet.markerChart("#chart-map")
            var tableChart = dc.dataTable("#shelters-table")


            d3.csv('/static/data/shelters-sample.csv', function (data) {
            // d3.json("/api/v0.1/shelters", function(dataObject) {
            //
            //     var data = []
            //     for (var key in dataObject) {
            //        data.push(dataObject[key])
            //     }
                var dateFormat = d3.time.format('%Y');

                var ndx = crossfilter(data);

                var allDimensions = ndx.dimension(function (d) {
                    return d;
                });
                var all = ndx.groupAll();
                var dataCount = dc.dataCount('#data-count')
                var zoneDimension = ndx.dimension(function (d) {
                    return d.Zone;
                });
                var zoneCount = zoneDimension.group().reduceCount()


                var crisisDimension = ndx.dimension(function (d) {
                    if (d['Associated disaster / Immediate cause']) {
                        return d['Associated disaster / Immediate cause'];
                    } else {
                        return 'No data'
                    }

                });
                var crisisCount = crisisDimension.group().reduceCount()
                var climateDimension = ndx.dimension(function (d) {
                    if (d['Climate zone']) {
                        return d['Climate zone'];
                    } else {
                        return 'No data'
                    }

                });
                var climateCount = climateDimension.group().reduceCount()


                var timeDimension = ndx.dimension(function (d) {
                    if (d['Year of construction (first completed shelters)']) {
                        return d3.time.year(dateFormat.parse(d['Year of construction (first completed shelters)']));
                    }
                    else {
                        return undefined;
                    }

                });
                var timeCount = timeDimension.group().reduceCount(
                        function (d) {
                            if (d['Year of construction (first completed shelters)']) {
                                return d['Year of construction (first completed shelters)'];
                            } else {
                                return undefined;
                            }

                        }
                );

                var shelters = ndx.dimension(function (d) {
                    if (d['GPS Latitude'] && d['GPS Longitude'])
                    {
                        return [d['GPS Latitude'], d['GPS Longitude']];
                    } else {
                        return undefined;
                    }

                });

                var countryDimension = ndx.dimension(function (d) {
                    if (d.Country) {
                        return d.Country;
                    } else {
                        return 'No data'
                    }

                })
                var countryCount = countryDimension.group().reduceCount()


                var sheltersGroup = shelters.group().reduceCount();

                mapChart.dimension(shelters)
                        .group(sheltersGroup)
                        .center([51.505, -0.09])
                        .zoom(2)
                        .filterByArea(true)
                        .cluster(true)
                        .on("filtered", getFiltersValues);

                addLayersToChart(mapChart)

                zoneChart
                        .width(110)
                        .height(110)
                        .dimension(zoneDimension)
                        .group(zoneCount)
                        .innerRadius(20)
                        .on("filtered", getFiltersValues);


                crisisChart
                        .width(110)
                        .height(110)
                        .dimension(crisisDimension)
                        .group(crisisCount)
                        .innerRadius(20)
                        .on("filtered", getFiltersValues);


                climateChart
                        .width(110)
                        .height(110)
                        .dimension(climateDimension)
                        .group(climateCount)
                        .innerRadius(20)
                        .on("filtered", getFiltersValues);
                ;

                timeChart
                        .width(500)
                        .height(120)
                        .dimension(timeDimension)
                        .group(timeCount)
                        .barPadding(5)
                        .x(d3.time.scale().domain([new Date(2008, 01, 01), new Date()]))
                        .xUnits(d3.time.year)
                        .on("filtered", getFiltersValues)
                         .yAxis().tickFormat(
                        function (v) { return d3.format('f')(v) ; });


                countryChart
                        .width(150)
                        .height(250)
                        .margins({left:0, right:10, top:10, bottom:20})
                        .dimension(countryDimension)
                        .group(countryCount)
                        .on("filtered", getFiltersValues)
                        .xAxis().tickFormat(
                        function (v) { return d3.format('f')(v) ; });



                tableChart
                        .dimension(allDimensions)
                        .group(function (d) {
                            return '';
                        })
                        .columns([
                            function (d) {
                                return d.ID;
                            },
                            function (d) {
                                return d['Name of shelter'];
                            },
                            function (d) {
                                return d.Zone;
                            },
                            function (d) {
                                return d.Country;
                            },
                            function (d) {
                                return d['Associated disaster / Immediate cause'];
                            },
                            function (d) {
                                return d['Climate zone'];
                            }
                        ])
                        .on('renderlet', function (table) {
                            // each time table is rendered remove nasty extra row dc.js insists on adding
                            table.select('tr.dc-table-group').remove();
                        })

                dataCount
                        .dimension(ndx)
                        .group(all)


                // Init chart filters

                function initFilters() {
                    var parseHash = /^#zone=([A-Za-z0-9,_\-\/\s]*)&crisis=([A-Za-z0-9,_\-\/\s]*)&climate=([A-Za-z0-9,_\-\/\s]*)&time=([A-Za-z0-9,_\-\/\s\(\):+]*)&country=([A-Za-z0-9,_\-\/\s]*)&map=(.*)$/;
                    var parsed = parseHash.exec(decodeURIComponent(location.hash.replace(/\+/g, ' ')));
                    // console.log("parsed:", parsed)
                    function filter(chart, rank) {

                        if (parsed[rank] == "") {
                            chart.filter(null);
                        }
                        else {
                            var filterValues = parsed[rank].split(",");

                            if (rank ==4 && filterValues.length==2) {   //filtering timeChart
                                filterValues[i] = new Date(filterValues[i])
                                var start = new Date(filterValues[0])
                                var end = new Date(filterValues[1])
                                chart.filter(dc.filters.RangedFilter(start,end))
                            }
                            else {
                                if (rank ==6) {
                                    // console.log('parsed:', filterValues)
                                    // filterValues = JSON.parse(filterValues)
                                    // console.log(filterValues)

                                } else {
                                    for (var i = 0; i < filterValues.length; i++) {
                                        chart.filter(filterValues[i]);
                                    }
                                }
                            }

                        }
                    }

                    if (parsed) {
                        filter(zoneChart, 1);
                        filter(crisisChart, 2);
                        filter(climateChart, 3);
                        filter(timeChart, 4);
                        filter(countryChart, 5)
                        filter(mapChart, 6);
                    }

                    dc.renderAll();

                }


                d3.select('#download')
                .on('click', function() {
                    var data = allDimensions.top(Infinity);
                    var blob = new Blob([d3.csv.format(data)], {type: "text/csv;charset=utf-8"});
                    saveAs(blob, 'data.csv');
                });

                initFilters()

            })

            d3.selectAll('#all').on('click', function () {
                dc.filterAll();
                dc.renderAll();
            });


            // Serializing filters values in URL
            function getFiltersValues() {
                var filters = [
                    {name: 'zone', value: zoneChart.filters()},
                    {name: 'crisis', value: crisisChart.filters()},
                    {name: 'climate', value: climateChart.filters()},
                    {name: 'time', value: timeChart.filters()},
                    {name: 'country', value: countryChart.filters()},
                    { name: 'map', value: JSON.stringify(mapChart.filters())}
                    ];

                // console.log("map:")
                // console.log(JSON.stringify(mapChart.filters()))
                var recursiveEncoded = $.param(filters);
                location.hash = recursiveEncoded;
            }

            d3.selectAll('#year').on('click', function () {
                timeChart.filterAll();
                dc.redrawAll();
              });
              d3.selectAll('#zone').on('click', function () {
                zoneChart.filterAll();
                dc.redrawAll();
              });
              d3.selectAll('#crisis').on('click', function () {
                crisisChart.filterAll();
                dc.redrawAll();
              });
            d3.selectAll('#climate').on('click', function () {
                climateChart.filterAll();
                dc.redrawAll();
              });
            d3.selectAll('#country').on('click', function () {
                countryChart.filterAll();
                dc.redrawAll();
              });


        })


        function addLayersToChart(mapChart) {
            var redCrossLayer = L.tileLayer.wms("https://shelter-database.org:8443/geoserver/ows?service=wms&version=1.1.1&request=GetCapabilities", {
                layers: 'shelters:redcross',
                transparent: true,
                opacity: 0.5

            });

            var koeppenGeigerLayer = L.tileLayer.wms("https://shelter-database.org:8443/geoserver/ows?service=wms&version=1.1.1&request=GetCapabilities", {
                layers: 'koeppen-geiger',
                transparent: true,
                opacity: 0.5
            })

            mapChart._doRender()
            var map = mapChart.map()


            var googleStreets = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: ''
            });

            var googleHybrid = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: ''
            });

            var googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: ''
            });

            var googleTerrain = L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: ''
            });

            var openStreetMap = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            })

            var baseLayers = {
                "Open Street Map": openStreetMap,
                "Google streets": googleStreets,
                "Google hybrid": googleHybrid,
                "Google satelite": googleSat,
                "Google physical": googleTerrain
            }

            L.control.layers(baseLayers, {
                "Climate simplified classification": redCrossLayer,
                "Koeppen-Geiger": koeppenGeigerLayer
            }).addTo(map);

        };

        d3.select("#share")
        .on('click', function() {
            window.prompt("Link to share:", window.location.href);
        })