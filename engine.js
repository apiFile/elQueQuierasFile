class Engine {

    db; //db

    constructor (db) {
        this.db = db;
    }

    getTable (tableName) {
        return db.getTable(tableName);
    }

    insertar (tabla/*Table Class*/, data) {
        tabla.data.push(data);
        return tabla.data.length;
    }

    buscar (tabla, findFunction) {
        let index = tabla.data.findIndex(x => findFunction);
        return tabla.data[index];
    }

    actualizar (tabla, fila, data) {
        let oldValue = tabla.data[fila];
        let newValue = tabla.data[fila] = data;
        return {oldValue, newValue};
    }
}

class Table {

    name;
    data = [];


    constructor (name = null) {
        if (name == null) throw "El nombre de una tabla no puede estar vacio";
        this.name = name;
    }

    addData (data) {
        this.data.push(data);
        return this;
    }
}