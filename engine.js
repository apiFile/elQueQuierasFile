class Engine {

    constructor (rawDb) {
        this.rawDb = rawDb;
        this.db = JSON.parse(rawDb);
        this.persistStack = [];
        this.persisStackTables = [];
    }

    getRepository (tableName) {
        //buscar si la tabla ya fue solicitada
        let tableModel;
        if (tableModel = this.persisStackTables.find(t => t.name === tableName)) return tableModel;
        //si no fue, buscarla en la base de datos
        let table;
        if (table = this.db.find(i => i.name === tableName)) {
            tableModel = new Table(table.name);
            tableModel.addData(table.data);
            this.persisStackTables.push(tableModel);
            return tableModel;
        }
        //si no existe devolver false
        return false;
    }

    persist(entity) {
        if ( ! this.isTableInStack(entity.table) )
            this.persisStackTables.push(entity.table);

        this.persistStack.push(entity);
    }

    isTableInStack (table) {
        return this.persisStackTables.find(t => t.name === table.name);
    }

    flush() {

        this.persistStack.forEach(e => {
            e.table.persistEntity(e);
        });
        this.persisStackTables.forEach(t => {
            t.updateEntities();

            //actualizar DB
            let index = this.db.findIndex(dbT => dbT.name === t.name);
            this.db[index] = t.getPlainObject();
            echo(this.db);
        });


    }
}

class Table {

    constructor (name = null) {
        if (name == null) throw "El nombre de una tabla no puede estar vacio";
        this.name = name;
        this.findersKeys = [];
        this.data = [];
        this.stackUpdateEntity = [];
    }

    addData (data/* Array */) {
        data.forEach(v => {
            this.addFindersKeys(v);
            this.data.push(v);
        });
        return this;
    }

    addFindersKeys (plainObject) {
        for (let keyObject in plainObject) {
            let existsKey = this.findersKeys.find(key => key === keyObject);
            if (!existsKey) {
                this.findersKeys.push(keyObject);
                this.createFinder(keyObject);
            }
        }
    }

    findOneBy (key, value) {
        return this.findBy(key, value)[0];
    }

    findBy (key, value) {
        let results = [];
        this.data.forEach(row => {

            if (!(key in row)) { echo(key+value); return};
            if (row[key] !== value) return;

            let entity;
            if (entity = this.stackUpdateEntity.find(e => e.id === row.id)) {
                results.push(entity);
                return;
            }
            entity = new Entity(row, this);
            this.stackUpdateEntity.push(entity)
            results.push(entity);
        });
        return results;
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

    persistEntity (entity) {
        entity.setId(this.data.length);
        return this.data.push(entity.getPlainObject());
    }

    updateEntities () {
        this.stackUpdateEntity.forEach(e => {
            this.data[e.getId()] = e.getPlainObject();
        });
    }

    getPlainObject () {
        let plainObject = {
            name: this.name,
            data: this.data
        }
        return plainObject;
    }
}

class Entity {

    constructor (plainObject, table = null) {
        this.table = table;
        Object.assign(this, plainObject);
        for (let key in plainObject) {
            let mKey = capitalizeFirstLetter(key);
            this[`get${mKey}`] = function () {
                return this.get(key);
            };
            this[`set${mKey}`] = function (value) {
                return this.set(key, value);
            };
        }
    }

    get(key) {
        return this[key];
    }

    set(key, value) {
        this[key] = value;
        return this;
    }

    getPlainObject () {
        let plainObject = {};
        for (let prop in this) {
            if ((typeof this[prop] !== "function") && (prop != "table")) {
                plainObject[prop] = this[prop];
            }
        }
        return plainObject;
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}