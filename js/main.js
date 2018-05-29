/**
 * Data base de ejemplo
 */

const db = [
    {
        name: "tabla1",
        rows: 22,
        data: [
            {
                name: "jhon",
                age: 21,
            },
            {
                name: "sergio",
                age: 26
            },
            {
                name: "zelda",
                age: "uknow",
                level: 25
            }
        ],
    },
    {
        name: "bulma",
        rows: 33,
        data: [
            {
                name: "jhon",
                age: 21,
            },
            {
                name: "sergio",
                age: 26
            },
            {
                name: "zelda",
                age: "uknow",
                level: 35
            }
        ],
    }
];

/*****/

const panel = {
    template: "#panel"
};

const tables = {
    template: "#tables",
    db: db,
    methods: {
        echo (data) {
            console.log(data);
        },
        dropTable (tableName) {

        }
    }
};

const tableViewer = {
    template: "#table-view",
    props: [ 'table' ]
};

const main = {
    template: '#main-component',
    components: {
        'panel': panel,
        'tables': tables,
        'table-viewer': tableViewer
    }
};

const routes = [
    { path: '/', component: main,
        children: [
            {path: '/tables', component: tables },
            {path: '/table-view', name: 'table-view', component: tableViewer, props:true }
        ]
    }
];

const router = new VueRouter({
    routes
});

