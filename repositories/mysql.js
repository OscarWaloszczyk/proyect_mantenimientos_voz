let ee = require('../services').ee;
let my = require('../services').con;
const my_cdr = require('../services').con_cdr;
let j  = require('../services').jconfig;


j.modulesLoad.mysql = 'yes';

/**
   @event MYSQL|execute
   @decript ejecuta la consulta enviada y envia el resultado por evento
   @params  varchar  ee_response  Nombre del evento para enviar el resultado
   @params  varchar  sql          Consulta a realizar
   @params  array    opt          Parametros de la consulta
   @emit    ee_response
     @params  varchar    err      Texto si la consulta ha dado error
     @params  BinaryRow  results  Resultado de la consultas
     @params  array      fields   Datos de la columnas del resultado
*/


ee.on('MYSQL|execute', (data,sql,opt)=>{
    //console.log('datos que sen vban a insertar-------------------------------',data,sql,opt);
    ee.emit('LOG',Date.now(),'mysql',1,'MYSQL|execute',sql,opt);
    ee.emit('LOG',Date.now(),'mysql',9,'MYSQL|execute',data,sql,opt);
    my.query(
	sql,
	opt,
	function( err,results,fields){
        if(err){
            ee.emit(data.err,data.err_dats,err);
        }else{
            ee.emit(data.emit,err,results,fields);
        }
	    //console.log(ee_response,err,results);
	}
    );
});

/**
   @event MYSQL|execute
   @decript ejecuta la consulta enviada y envia el resultado por evento
   @params  varchar  ee_response  Nombre del evento para enviar el resultado
   @params  varchar  sql          Consulta a realizar
   @params  array    opt          Parametros de la consulta
   @emit    ee_response
     @params  varchar    err      Texto si la consulta ha dado error
     @params  BinaryRow  results  Resultado de la consultas
     @params  array      fields   Datos de la columnas del resultado
*/


ee.on('MYSQL|execute|v2', (data, sql, opt, dats) => {
    //console.log('datos que sen vban a insertar-------------------------------',data,sql,opt);
    ee.emit('LOG',Date.now(),'mysql',1,'MYSQL|execute|v2',sql,opt);
    ee.emit('LOG',Date.now(),'mysql',9,'MYSQL|execute|v2',data,sql,opt,dats);
    my.query(
        sql,
        opt,
        function (err, results, fields) {
            if (err) {
                ee.emit(data.err, data.err_dats, err,dats);
            } else {
                ee.emit(data.emit, err, results, fields,dats);
            }
            //console.log(ee_response,err,results);
        }
    );
});

/**
   @event MYSQL|record
   @decript Env�a peticiones SQL a la BBDD
   @params  varchar QL    Query SQL
   @params  array   OPT   Opciones para comletar la consulta
   @params  int     id    Id de ejecucion de la consulta SQL
   @emit 'MYSQL|results'
     @params  int        id        Id de ejecucion de la consulta SQL
     @params  BinaryRow  results   Resultado de la consultas
     @params  varchar    err       Texto si la consulta ha dado error
*/
ee.on('MYSQL|record', (QL,OPT,id)=>{
    ee.emit('LOG',Date.now(),'mysql',9,'RECORD',QL,OPT,id);
    my.query(
	QL,
	OPT,
	function(err,results,fields){
	    ee.emit('MYSQL|results',id,results,err);
	}
    );
});

/**
   @event MYSQL|executecdr
   @decript ejecuta la consulta enviada y envia el resultado por evento para cdrs
   @params  varchar  ee_response  Nombre del evento para enviar el resultado
   @params  varchar  sql          Consulta a realizar
   @params  array    opt          Parametros de la consulta
   @emit    ee_response
     @params  varchar    err      Texto si la consulta ha dado error
     @params  BinaryRow  results  Resultado de la consultas
     @params  array      fields   Datos de la columnas del resultado
*/
ee.on('MYSQL|executecdr|v2', (data, sql, opt, dats) => {
    //console.log('datos que sen vban a insertar-------------------------------',data,sql,opt);
    ee.emit('LOG',Date.now(),'mysql',1,'MYSQL|executecdr|v2',sql,opt);
    ee.emit('LOG',Date.now(),'mysql',9,'MYSQL|executecdr|v2',data,sql,opt,dats);
    my_cdr.query(
        sql,
        opt,
        function (err, results, fields) {
            if (err) {
                ee.emit(data.err, data.err_dats, err,dats);
            } else {
                ee.emit(data.emit, err, results, fields,dats);
            }
            //console.log(ee_response,err,results);
        }
    );
});
