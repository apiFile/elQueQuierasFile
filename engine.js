//TODO agregar relaciones(clave foranea)
//TODO los metodos para consumir deberian ser promises
//TODO mejorar la interfaz del engine pls :'v

/**
 * Interface para la base de datos
 * @interface
 */
class DataProvider {

    /**
     * Obtiene un json String que representa una base de datos
     * @param {String}dbName
     * @return {string}JSON
     */
    static createDb (dbName) {
        return `{"name": "${dbName}", "tables": {}}`;
    }

    static createTable (tableName) {
        return `{"name": "${tableName}", "data": {} }`
    }

    static insertTable (tableJson, dbJson) {
        let tableHeaders = {}
        let table = JSON.parse(tableJson);
        let db = JSON.parse(dbJson)

        tableHeaders.name = table.name;

        let rows = 0
        let keys = {}
        let currentId

        //fetch keys
        for (currentId in table.data) {

            let entity = new Entity(table.data[currentId])

            entity.keys.forEach(k => {
                if ( ! (k in keys)) {
                    keys[k] = {count: 1}
                } else {
                    keys[k].count++;
                }

            })

            // row count
            rows++;
        }

        tableHeaders.rows = rows
        tableHeaders.keys = keys
        tableHeaders.last_id = currentId || -1

        echo(tableHeaders.last_id)
        db.tables[tableHeaders.name] = tableHeaders;

        return JSON.stringify(db);
    }


    /**
     * Devuelve un objeto que representa los datos de un archivo base de datos (en proxima versiones devolvera un JSON y no un objeto)
     */
    getDb () {}

    /**
     *Actualiza los datos de base de datos
     * @param {String}db
     */
    setDb (dbJson) {}

    /**
     * Devuelve el JSON de una tabla
     * @param {String} name Nombre de la tabla a obetener
     */
    getTable (name) {}

    /**
     * Actualiza el JSON de una tabla
     * @param {String} name Nombre de la tabla
     * @param {String} table datos de la tabla en formato JSON
     */
    setTable (name, table) {}

    getTableHeader (name) {}
}

class VirtualDb extends DataProvider{

    constructor (dbInfo) {
        super();
        this.rawTables = new Map();
        this.db = dbInfo;
    }

    setVirtualTable (name, rawData) {
        this.rawTables.set(name, rawData);
    }

    getVirtualTable (name) {
        return this.rawTables.get(name);
    }

    getVirtualDb () {
        return this.db
    }

    setVirtualDb(db) {
        this.db = db;
        return this
    }

    getDb () { return this.getVirtualDb() }
    setDb (db) { return this.setVirtualDb(db) }
    getTable (name) { return this.getVirtualTable(name)}
    setTable (name, table) { return this.setVirtualTable(name, table)}

    getTableHeader (name) {
        let db = JSON.parse(this.db)
        if ( ! (name in db.tables)) return false
        return db.tables[name];
    }
}

/**
 * Clase para manejar base de datos JSON
 */
class Engine {

    /**
     *
     * @param {DataProvider}dataProvider
     */
    constructor (dataProvider) {
        this.dataProvider = dataProvider;
        this.tablesToModify = new Map();
    }

    /**
     * Devuelve un objeto que representa una tabla (contiene todos las filas dentro)
     * @param {String} name nombre de la tabla
     * @return {Object}
     */
    getTable (name) {

        let rawData = this.dataProvider.getTable(name);
        return JSON.parse(rawData);
    }

    /**
     * Devuelve un objeto que representa todos las filas de una tabla
     * @param {String} name nombre de la tabla
     * @return {Object}
     */
    getDataTable (name) {
        let table = this.getTable(name);
        return table.data;
    }

    /**
     * Devuelve una representacion de una tabla como objeto (Repository)
     * @param {String}name nombre de la tabla
     * @return {ProxyTable}
     */
    getTableInterface (name) {
        let tableHeader = this.dataProvider.getTableHeader(name);
        if ( ! tableHeader) return false;

        return new ProxyTable(tableHeader, this);
    }

    /**
     * Persiste una entidad/fila en la base de datos
     * @param {Entity | Entity[]}entity
     */
    persist(entity) {

        if ( Array.isArray(entity) ) {
            entity.forEach(e => {
                this.persist(e);
            })

            return;
        }

        let referenceTableObject = this.tablesToModify.get(entity.tableName);

        if ( ! referenceTableObject) {
            referenceTableObject = new TableReference(entity.tableName);
            referenceTableObject.addEntityToPersist(entity);
            this.tablesToModify.set(referenceTableObject.name, referenceTableObject);
        } else {
            referenceTableObject.addEntityToPersist(entity);
        }
    }

    /**
     * Actualiza una entidad en la base de datos
     * @param {Entity | Entity[]}entity
     */
    update (entity) {

        if ( Array.isArray(entity) ) {
            entity.forEach(e => {
                this.update(e);
            })

            return;
        }

        let referenceTableObject = this.tablesToModify.get(entity.tableName);

        if ( ! referenceTableObject) {
            referenceTableObject = new TableReference(entity.tableName);
            referenceTableObject.addEntityToUpdate(entity);
            this.tablesToModify.set(referenceTableObject.name, referenceTableObject);
        } else {
            referenceTableObject.addEntityToUpdate(entity);
        }
    }

    /**
     * Borra una entidad/fila de la base de datos
     * @param {Entity | Entity[]}entity
     */
    remove (entity) {

        if ( Array.isArray(entity) ) {
            entity.forEach(e => {
                this.remove(e);
            })

            return;
        }

        let referenceTableObject = this.tablesToModify.get(entity.tableName);

        if ( ! referenceTableObject) {
            referenceTableObject = new TableReference(entity.tableName);
            referenceTableObject.addEntityToRemove(entity);
            this.tablesToModify.set(referenceTableObject.name, referenceTableObject);
        } else {
            referenceTableObject.addEntityToRemove(entity);
        }
    }

    /**
     * ejecuta todas los persist/update/remove en la lista y actualiza la base de datos
     */
    flush() {

        let db = this.dataProvider.getDb();
        db = JSON.parse(db);

        this.tablesToModify.forEach(currentTable => {

            let table = this.getTable(currentTable.name);
            let tableHeaders = db.tables[currentTable.name];

            currentTable.entityToPersist.forEach(e => {

                tableHeaders.last_id++;

                tableHeaders.rows++;

                //update keys of table headers ***************

                e.keys.forEach(keyName => {
                    if ( ! (keyName in tableHeaders.keys)) {
                        tableHeaders.keys[keyName] = {count: 1}
                    } else {
                        tableHeaders.keys[keyName].count++;
                    }
                })
                //**********************************

                e.setId(tableHeaders.last_id);
                table.data[e.getId()] = e.getPlainObject();
            })

            currentTable.entityToUpdate.forEach(newEntity => {
                table.data[newEntity.getId()] = newEntity.getPlainObject();
            })

            currentTable.entityToRemove.forEach(oldEntity => {

                //update keys of table headers ***************
                oldEntity.keys.forEach(keyName => {

                    if ( ! (keyName in tableHeaders.keys)) {
                        return
                    } else {
                        tableHeaders.keys[keyName].count--;
                    }
                    if ( tableHeaders.keys[keyName].count === 0)
                        delete tableHeaders.keys[keyName]
                })
                //**********************************
                tableHeaders.rows--;
                delete table.data[oldEntity.getId()];
            })
            this.dataProvider.setTable(currentTable.name, JSON.stringify(table));
        });

        this.dataProvider.setDb(JSON.stringify(db));

        //borrar referencias
        this.tablesToModify.clear();
    }
}


class TableReference {
    constructor (tableName) {
        this.name = tableName;
        this.entityToPersist = []
        this.entityToUpdate = []
        this.entityToRemove = []
    }

    addEntityToPersist (entity) {
        this.entityToPersist.push(entity);
    }

    addEntityToUpdate (entity) {
        this.entityToUpdate.push(entity);
    }

    addEntityToRemove (entity) {
        this.entityToRemove.push(entity);
    }
}

/**
 * Representacion de una tabla en la base de datos (repository)
 */
class ProxyTable {

    /**
     *
     * @param {Object} options
     * @param {String} otions.name Nombre de tabla
     * @param {Object} otions.keys Campos de la tablas
     * @param {Number | String} otions.id Id de la tabla
     * @param {Number | String} otions.last_id Ultimo id de la tabla
     * @param {Number | String} otions.rows Filas de la tabla
     * @param {Engine}db
     */
    constructor ({name, keys = {},id = false, last_id = 0, rows = 0}, db) {
        this.name = name;
        this.finders = keys
        this.last_id = last_id
        this.rows = rows
        this.db = db

        this.initFindersKeys();
    }

    initFindersKeys () {
        for ( let key in this.finders) {
            this.createFinder(key)
        }
    }

    /**
     * Encuentra una entrada/fila por su id
     * @param id
     * @return {Entity}
     */
    findOneById(id) {
        let data = this.db.getDataTable(this.name);
        if ( ! data[id] ) return false;
        let plainRow = {};
        Object.assign(plainRow, data[id], {id});
        let entity = new Entity(plainRow, this.name);
        return entity;
    }

    createFinder (key) {
        let capitalizeKey = capitalizeFirstLetter(key);
        this[`findBy${capitalizeKey}`] = function (value) {
            return this.findBy(key, value);
        }
        this[`findOneBy${capitalizeKey}`] = function (value) {
            return this.findOneBy(key, value);
        }
    }

    /**
     * Encuentra una entrada/fila por su campo y valor
     * @param key
     * @param value
     * @return {Entity}
     */
    findOneBy (key, value) {
        if ( ! key in this.finders)
            return ;

        let data = this.db.getDataTable(this.name);
        let entity;

        for(let row in data) {
            if ( ! (key in data[row]) ) continue
            if ( data[row][key] !== value ) continue
            let plainRow = {};
            Object.assign(plainRow, data[row], {id: row});
            entity = new Entity(plainRow, this.name);
            break;
        }

        return entity;
    }

    /**
     * Encuentra una o muchas entradas/fila en una tabla por su campo y valor
     * @param key
     * @param value
     * @return {Entity[]}
     */
    findBy (key, value) {
        if ( ! key in this.finders)
            return ;

        let data = this.db.getDataTable(this.name);
        let results = [];

        for(let row in data) {
            if ( ! (key in data[row]) ) continue
            if ( data[row][key] !== value ) continue
            let plainRow = {};
            let entity;
            Object.assign(plainRow, data[row], {id: row});
            entity = new Entity(plainRow, this.name);
            results.push(entity);
        }

        return results;
    }

}

/**
 * Clase que representa una entrada/fila
 */
class Entity {

    /**
     *
     * @param {}plainObject
     * @param {ProxyTable}table
     */
    constructor (plainObject, tableName) {

        if ( ! plainObject.hasOwnProperty('id'))
            plainObject['id'] = false;

        this.tableName = tableName;
        this.keys = [];
        Object.assign(this, plainObject);
        this.initSetterAndGetters(plainObject);
    }

    initSetterAndGetters (plainObject) {

        for (let key in plainObject) {

            if ( key !== 'id')
                this.keys.push(key);

            let mKey = capitalizeFirstLetter(key);
            this[`get${mKey}`] = function () {
                return this.get(key);
            };
            this[`set${mKey}`] = function (value) {
                return this.set(key, value);
            };
        }
    }

    /**
     * Obtiene el valor de un campo
     * @param {String} key
     * @return {*}
     */
    get(key) {
        return this[key];
    }

    /**
     * Selecciona el valor de un campo
     * @param {String} key
     * @param value
     * @return {Entity}
     */
    set(key, value) {
        this[key] = value;
        return this;
    }

    getPlainObject () {
        let plainObject = {};
        for (let prop in this) {
            if ((typeof this[prop] !== "function") && (prop != "tableName") && (prop != 'id') && (prop != 'keys')) {
                plainObject[prop] = this[prop];
            }
        }
        return plainObject;
    }
}

/*
https://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript?answertab=votes#tab-top
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
