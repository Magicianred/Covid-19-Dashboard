//calcolo anno corrente
let getYear = new Date().getFullYear()
document.getElementById('year').innerHTML = getYear

fetch("https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-regioni.json")
    .then(response => response.json())
    .then(dati => {


        let modalRegion = document.querySelector('#region')
        let modalTrend = document.querySelector('#trend')
        let modalContentRegion = document.querySelector('#ModalContentRegion')
        let modalContentTrend = document.querySelector('#ModalContentTrend')

        //colori 
        let ColorTotalCases = "#fe744f"
        let ColorDeath = '#dc3445'
        let ColorDischergedHealed = '#198754'
        let ColorNewPositive = "#ffc107"

        //ordino i dati
        let sorted = dati; //.reverse();
        console.log(sorted);
        sorted = _.sortBy(dati, ['data', 'codice_regione']);
        console.log(sorted);
        sorted = _.orderBy(dati, ['data', 'codice_regione'], ['desc', 'asc']);
        console.log(sorted);
        //ultima data caricata
        let lastUpdated = sorted[0].data

        //formattazione data dell'ultimo aggiornamento
        let lastUpdatedFormatted = lastUpdated.split("T")[0].split("-").reverse().join("/")
        /*let lastUpdatedFormattedHour = lastUpdated.split("T")[1]*/
        document.getElementById("data").innerHTML = `Dati aggiornati al: ${lastUpdatedFormatted}`

        //regione con più casi
        let lastUpdatedData = sorted.filter(el => el.data == lastUpdated).sort((a, b) => b.nuovi_positivi - a.nuovi_positivi)

        //totale casi
        let totalCases = lastUpdatedData.map(el => el.totale_casi).reduce((t, n) => t + n)

        let formatNumberCases = new Intl.NumberFormat('it-IT').format(totalCases)
        document.getElementById("totalCases").innerHTML = formatNumberCases

        //totale guariti
        let totalRecovered = lastUpdatedData.map(el => el.dimessi_guariti).reduce((t, n) => t + n)
        let formatNumberRecovered = new Intl.NumberFormat('it-IT').format(totalRecovered)
        document.getElementById("totalRecovered").innerHTML = formatNumberRecovered

        //morti totali con formattazione numeri
        let totalDeath = lastUpdatedData.map(el => el.deceduti).reduce((t, n) => t + n)
        let formatNumberDeath = new Intl.NumberFormat('it-IT').format(totalDeath)
        document.getElementById("totalDeath").innerHTML = formatNumberDeath

        //totale positivi
        let totalPositive = lastUpdatedData.map(el => el.nuovi_positivi).reduce((t, n) => t + n)
        let formatNumberPositive = new Intl.NumberFormat('it-IT').format(totalPositive)
        document.getElementById("totalPositive").innerHTML = formatNumberPositive

        //perendo i giorni senza doppioni
        let days = Array.from(new Set(sorted.map(el => el.data))).reverse()

        document.querySelectorAll('[data-trend]').forEach(el => {
            el.addEventListener('click', () => {

                //formatto la data
                let formatDays = days.flatMap(el => el.split("T")[0].split("-").reverse().join("/"))

                //prendo l'attributo data-region
                let set = el.dataset.trend

                //casi per ogni giorno e le data
                let totalsForDays = days.map(el => [el, sorted.filter(i => i.data == el).map(e => e[set]).reduce((t, n) => t + n)])

                modalTrend.classList.add('active')
                modalContentTrend.innerHTML =
                    `
                        <div class="modal-custom-header">
                                <h3 class="fs-3">${set.replace(/_/g, " ").toUpperCase()}</h3> <span class="close" id="closeTrend">&times;</span>
                        </div>
                        <div class="modal-custom-body">
                            <div class="row">
                                <div class="col-12">
                                    <canvas id="totalTrend"></canvas>
                                </div>
                            </div>
                        </div>
                    `

                let setColor = (set) => {
                    if (set == "totale_casi") {
                        return ColorTotalCases
                    } else if (set == "dimessi_guariti") {
                        return ColorDischergedHealed
                    } else if (set == "deceduti") {
                        return ColorDeath
                    } else if (set == "nuovi_positivi") {
                        return ColorNewPositive
                    }
                }


                var ctx = document.getElementById('totalTrend').getContext('2d');
                var chart = new Chart(ctx, {
                    // The type of chart we want to create
                    type: 'line',

                    // The data for our dataset
                    data: {
                        labels: formatDays,
                        datasets: [{
                            label: set.replace(/_/g, " ").toUpperCase(),
                            backgroundColor: setColor(set),
                            borderColor: setColor(set),
                            data: totalsForDays.map(el => el[1])
                        }]
                    },

                    // Configuration options go here
                    options: {

                    }
                });

                //chiusura per mobile
                let modalCloseTrend = document.querySelector('#closeTrend')
                modalCloseTrend.addEventListener('click', () => {
                    modalTrend.classList.remove('active')

                })
                //chiusura click fuori
                window.addEventListener('click', function (e) {
                    if (e.target == modalTrend) {
                        modalTrend.classList.remove('active')
                    }
                })
            })
        })


        //card regioni con positivi oggi
        let cardWrapper = document.getElementById("cardWrapper")
        lastUpdatedData.forEach(el => {

            let stringVariazione = String(el.variazione_totale_positivi).startsWith("-") ? el.variazione_totale_positivi : `+${el.variazione_totale_positivi}`

            let div = document.createElement('div')
            div.classList.add('col-12', 'col-md-3', 'my-4')
            div.innerHTML =
                `
                    <div class="card-custom h-100 rounded-3 d-flex flex-column" data-region="${el.denominazione_regione}">
                        <p class="mb-0 ms-3 mt-3">${el.denominazione_regione}</p>
                        <p class="fw-bold fs-4 mb-0 ms-3">${new Intl.NumberFormat("it-IT").format(el.nuovi_positivi)}</p>
                        <p class="small my-0 ms-3"> ${stringVariazione}</p>
                        <hr class="text-main">
                        <p class="text-main ms-3">scopri di più</p>
                    </div>
                `
            cardWrapper.appendChild(div)

        });

        //apertura modale
        document.querySelectorAll('[data-region]').forEach(el => {
            el.addEventListener('click', () => {
                let region = el.dataset.region
                modalRegion.classList.add('active')

                let dataAboutRegion = lastUpdatedData.filter(el => el.denominazione_regione == region)[0]

                modalContentRegion.innerHTML =
                    `
                        <div class="modal-custom-header">
                            <h3 class="fs-3">${dataAboutRegion.denominazione_regione}</h3> <span class="close" id="close">&times;</span>
                        </div>
                        <div class="modal-custom-body">
                            <div class="row">
                                <div class="col-12">
                                    <canvas id="pinRegion"></canvas>
                                </div>
                            </div>
                            <div class="row mt-5">
                                <div class="col-12">
                                    <canvas id="trendNew"></canvas>
                                </div>
                            </div>
                        </div>
                    `
                var ctx = document.getElementById('pinRegion');
                var test = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Totale casi', 'Dimessi guariti', 'Deceduti', 'Nuovi positivi'],
                        datasets: [{
                            label: '# of Votes',
                            data: [dataAboutRegion.totale_casi, dataAboutRegion.dimessi_guariti, dataAboutRegion.deceduti, dataAboutRegion.nuovi_positivi],
                            backgroundColor: [
                                ColorTotalCases,
                                ColorDischergedHealed,
                                ColorDeath,
                                ColorNewPositive,
                            ],
                            borderColor: [
                                ColorTotalCases,
                                ColorDischergedHealed,
                                ColorDeath,
                                ColorNewPositive,
                            ],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true
                                }
                            }]
                        }
                    }
                });


                //chiusura per mobile
                let modalClose = document.querySelector('#close')
                modalClose.addEventListener('click', () => {
                    modalRegion.classList.remove('active')
                })
                //chiusura click fuori
                window.addEventListener('click', function (e) {
                    if (e.target == modalRegion) {
                        modalRegion.classList.remove('active')
                    }
                })

                //dati per ogni regione data dal più vecchio + positivi + deceduti + guariti
                let trendData = sorted.map(el => el).reverse().filter(el => el.denominazione_regione == region).map(el => [el.data, el.nuovi_positivi, el.deceduti, el.dimessi_guariti])
                console.log(trendData[0]);


                var ctx = document.getElementById('trendNew').getContext('2d');
                var chart = new Chart(ctx, {
                    // The type of chart we want to create
                    type: 'line',

                    // The data for our dataset
                    data: {
                        labels: trendData.map(el => el[0].split("T")[0].split("-").reverse().join("/")),
                        datasets: [{
                            label: ["Trend totale casi"],
                            backgroundColor: ColorTotalCases,
                            borderColor: ColorTotalCases,
                            data: trendData.map(el => el[1])
                        },
                        {
                            label: ["Trend decessi"],
                            backgroundColor: ColorDeath,
                            borderColor: ColorDeath,
                            data: trendData.map(el => el[2])
                        },
                        {
                            label: ["Trend ricoverati"],
                            backgroundColor: "#0d6efd",
                            borderColor: "#558bdb",
                            data: trendData.map(el => el[3])
                        }
                        ]
                    },

                    // Configuration options go here
                    options: {

                    }
                });

            })

        })

    })