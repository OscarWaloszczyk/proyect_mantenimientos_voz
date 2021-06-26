'use strict';
/**
 * @description Se guarda en log los datos de node central
 * @author Oscar Waloszczyk, Alfredo Roman
 * v0.4
 * 
 * @level Nivel de debug 
 * - 1 log Generic
 * - 2 log Generic 1 Detail
 * - 3 log Generic more detail
 * - 4 log Generic more detail AND EXCEPTION
 * - 5 log Generic + EVENT 
 * - 6 log event 
 * - 7 log event detail
 * - 8 log event extra detail
 * - 9 log event Extreme Detail
 * - 
 * NOTA: EL LOG PUEDE SER modificado en caliente
 * @usage ee.emit('LOG',Date.now(), typename, level, dat1,dat2,dat3...
 * @config {
 debug: {
   typename1:  level,               -- Nombre del tipo de log ejemplo IO, queue,IVR...
   typename2:  level,
   typename... :  level,
   "fpath" : "/var/log/",           -- direccion donde se almacena el o los ficheros
   "fname" : "node_admin.log",      -- Nombre del por defecto agrupado
   "fspaces": false,                -- False agrupado, TRUE separa en ficheros LOG por cada typename
   "log_file":  3                   -- level para almacenar los LOG a los ficheros
   "log_console": 3,                -- level para mostrar por pantalla los LOG
   "event" : 4
}

 }
 */

let fs      = require('../services').fs;
let ee      = require('../services').ee;
let c       = require('../services').config;
let archivo = c.config.debug.files || './file_bk';
let event   = c.config.debug.event || 5;

/**
 * @description guarda los log del sistema.
 * @llamada ee.emit('LOG', date, name, data, level);
 */
ee.on('LOG', function (date, name,level, data){

    //test namespace
    if( c.config.debug[name] === undefined ){c.config.debug[name] = event;}
    if( level > c.config.debug[name]){return;}//si es mayor al numero indicado en config, no hacemos nada.
    

    //obtain text log   
    let txtdata = '['+date+']';
    for (let i = 3; i < arguments.length; i++) {
	txtdata += ' '+convertToString(arguments[i]);
    }
    
    if (level <= c.config.debug.log_file){
        logFile(level,name,txtdata);
    }
    if (level <= c.config.debug.log_console){
        logConsole(level,name,txtdata);
    }
    if(level <= event ){
	ee.emit('CONTROL|send',{
	    event_name: 'LOG',
	    dats: {
		server_name : c.config.server_info.name,
		name,
		txtdata,
		level
	    }
	});
    }
});

/**
 * @description Convierte un Json en string
 * @param {objet} Informacion de LOG
 * @return array [error, string]
*/
function safeJson(str) {
    try {
        return [null, JSON.stringify(str)];
    } catch (err) {
        return [err];
    }
 }

/**
 * @description Devuelve de una [string,json] un string con seguridad
 * @param {objet}
 * @return {string} 
 */
function convertToString(str){
    if( typeof log == "string" ){
	return str;
    }else{
	const [err, text] = safeJson(str);
	if(err){
	    return '[object]';
	}else{
	    return text;
	}
    }
}


/**
 * @description Record in logs file with path   
 * @param {string,json} Infomation to LOG
 * @param {string} Log level
 * @param {string} Name for log leve definition 
*/

function logFile(level,namespace,txtdata){

    //obtain path comlete file 
    let path = c.config.debug.fpath;
    if( c.config.debug.fspaces){
	path += namespace;	
    }else{
	path += c.config.debug.fname;
    }
   
    
    //test file exist 
    if (fs.existsSync(path)){

	//file exits OK,  add new comment
	fs.appendFile(path, txtdata, (error) =>{
	    if(error){
		console.log('error 2: ' , path , namespace , error);
	    }
	});
    }else{
	const writeFileAsync = (txtdata) => {
            fs.writeFile(path, txtdata, (error) => {
                if (error) {
                    console.log('error 3: ' , path , namespace , error);
                }
            });
        };
        writeFileAsync(txtdata);	    
    }
}

function logConsole(level,namespace,txtdata){
    console.log(level + '|' + namespace + ':',txtdata);    
}

