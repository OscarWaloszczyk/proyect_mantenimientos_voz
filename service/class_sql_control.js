'use strict';

/**
 * @description control de los inserts or updates que se realizan desde el node aa, si la query se realiza correctemnet se emimina si no se notifica con error y se gurada en un fichero el sql
 * @version 1.0.01
 */
let control_sql = require('../services').control_sql;

function sql_control (){
    this.instance=(data)=>{
        try {
            if (control_sql[data.id]===undefined){
                control_sql[data.id] = {
                    id  : data.id,
                    sql : data.sql,
                    data: data.data,
                    try :0
                }
            }else {
                // ya existe esta sql
                console.log('ya existe esta sql');
            }
        } catch (err) {
            console.log('sql_control,instance',err);
        }
    }
    // eliminamos el la sql
    this.success=(id)=>{
        try {
            if (control_sql[id]!==undefined){
                delete control_sql[id];
            }
        } catch (err) {
            console.log('success',err);
        }
    }
    // consula ha fallado volvber a lanzar
    this.error=(id)=>{
        try {
            if (control_sql[id]!==undefined){
                if (control_sql[id].try == 3){
                    // guardar en fichero
                    //...
                }else{
                    control_sql[id].try +=1;
                    // lanzamo de nuevo la consulta
                    ee.emit('MYSQL|RELEASE', id, control_sql[id].sql, control_sql[id].data);
                }
            } 
        } catch (err) {
            console.log('error',err);
        }
    }
}

module.exports = {
    sql_control
}