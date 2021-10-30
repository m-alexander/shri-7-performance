function quantile(arr, q) {
    const sorted = arr.sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;

    if (sorted[base + 1] !== undefined) {
        return Math.floor(sorted[base] + rest * (sorted[base + 1] - sorted[base]));
    } else {
        return Math.floor(sorted[base]);
    }
};

function prepareData(result) {
    return result.data.map(item => {
        item.date = item.timestamp.split('T')[0];

        return item;
    });
}

function addMetricByPeriod(data, page, dateFrom, dateTo) {
    let groups = data.reduce((acc, item) => {
        if (item.page == page && item.date >= dateFrom && item.date >= dateTo) {
            const key = `${item.date}-${item.name}`
            if (!acc[key]) {
                acc[key] = [item]
            } else {
                acc[key].push(item)
            }
        }
        return acc
    }, {})

    const sampleData = Object.values(groups).map(group => {
        const values = group.map(item => item.value)
        return {
            date: group[0].date,
            name: group[0].name,
            hits: values.length,
            p25: quantile(values, 0.25),
            p50: quantile(values, 0.5),
            p75: quantile(values, 0.75),
            p95: quantile(values, 0.95),
        }
    })

    return sampleData;
}

// показать значение метрики за несколько день
function showMetricByPeriod(data, page, dateFrom, dateTo) {
    console.log(`All metrics for ${dateFrom} - ${dateTo}:`);

    console.table(addMetricByPeriod(data, page, dateFrom, dateTo));
}

function addMetricBySession(data, page, name, requestId) {
    let sampleData = data
        .filter(item => item.page == page && item.name == name && item.requestId == requestId)
        .map(item => item.value);

    let result = {};

    result.hits = sampleData.length;
    result.p25 = quantile(sampleData, 0.25);
    result.p50 = quantile(sampleData, 0.5);
    result.p75 = quantile(sampleData, 0.75);
    result.p95 = quantile(sampleData, 0.95);

    return result;
}

// показать сессию пользователя
function showSession(data, page, requestId) {
    console.log(`All metrics for requestId ${requestId}:`);

    let table = {};
    table.connect = addMetricBySession(data, page, 'connect', requestId);
    table.ttfb = addMetricBySession(data, page, 'ttfb', requestId);
    table.load = addMetricBySession(data, page, 'load', requestId);
    table.square = addMetricBySession(data, page, 'square', requestId);
    table.load = addMetricBySession(data, page, 'load', requestId);
    table.generate = addMetricBySession(data, page, 'generate', requestId);
    table.draw = addMetricBySession(data, page, 'draw', requestId);

    console.table(table);
}


// сравнить метрику в разных срезах
function compareMetric(data, page, date, additional) {
    console.log(`Compare metric by ${additional}:`);

    let groups = data.reduce((acc, item) => {
        if (item.page == page && item.date == date) {
            const key = item.additional[additional]
            if (!acc[key]) {
                acc[key] = [item.value]
            } else {
                acc[key].push(item.value)
            }
        }
        return acc
    }, {})


    Object.keys(groups).forEach(group => {
        const sampleData = groups[group]

        let result = {};

        result.hits = sampleData.length;
        result.p25 = quantile(sampleData, 0.25);
        result.p50 = quantile(sampleData, 0.5);
        result.p75 = quantile(sampleData, 0.75);
        result.p95 = quantile(sampleData, 0.95);

        groups[group] = result;
    })

    console.table(groups);
}

// любые другие сценарии, которые считаете полезными


// Пример
// добавить метрику за выбранный день
function addMetricByDate(data, page, name, date) {
    let sampleData = data
        .filter(item => item.page == page && item.name == name && item.date == date)
        .map(item => item.value);

    let result = {};

    result.hits = sampleData.length;
    result.p25 = quantile(sampleData, 0.25);
    result.p50 = quantile(sampleData, 0.5);
    result.p75 = quantile(sampleData, 0.75);
    result.p95 = quantile(sampleData, 0.95);

    return result;
}

// рассчитывает все метрики за день
function calcMetricsByDate(data, page, date) {
    console.log(`All metrics for ${date}:`);

    let table = {};
    table.connect = addMetricByDate(data, page, 'connect', date);
    table.ttfb = addMetricByDate(data, page, 'ttfb', date);
    table.load = addMetricByDate(data, page, 'load', date);
    table.square = addMetricByDate(data, page, 'square', date);
    table.load = addMetricByDate(data, page, 'load', date);
    table.generate = addMetricByDate(data, page, 'generate', date);
    table.draw = addMetricByDate(data, page, 'draw', date);

    console.table(table);
};

// 3E81B897-07EB-4824-A0C1-69AADCED0AC6
fetch('https://shri.yandex/hw/stat/data?counterId=D8F28E50-3339-11EC-9EDF-9F93090795B1')
    .then(res => res.json())
    .then(result => {
        let data = prepareData(result);
        // console.log(data)

        calcMetricsByDate(data, 'send test', '2021-10-22');
        showMetricByPeriod(data, 'send test', '2021-10-22', '2021-10-25')
        showSession(data, 'send test', "532193160014")
        compareMetric(data, 'send test', '2021-10-22', 'platform')

        // добавить свои сценарии, реализовать функции выше
    });
