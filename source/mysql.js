/**
 * @description Ejeplo uso
 * @param {id_marcador: data.id_marcador, 
 *          id_lista: data.id_lista, 
 *          id_contacto: data.id_contacto}
 * @version 1.0.01
 */
ee.emit('MYSQL|CONTACTOS|answer', (data)=>{
    try {
        const id  = f.actionIDGenerator();
        const sql = 'CALL sp_AA_answer(?,?,?)';
        const d = [data.id_marcador, data.id_lista, data.id_contacto];
        aa_sql_control.instance({id, sql, data:d});
        my.query(sql, d, function(error, results, fields) {
            if (error) {
                // controla el error
                aa_sql_control.error(id);
            }else {
                aa_sql_control.success(id);
            }
        });
    } catch (err) {
        ee.emit('LOG', new Date().toISOString(),'MYSQL|CONTACTOS|answer',4, 'Err answer:',err.toString());

    }
});

/**
 * @description nuevo ientento de guardar en la base de datos los datos de un consulta
 */
 ee.on('MYSQL|RELEASE', (id, sql, data)=>{
    try {
        my.query(sql,data, function(error, results, fields) {
            if (error) {
                aa_sql_control.error(id);
            }else{
                aa_sql_control.success(id);
            }
        });
    } catch (err) {
        ee.emit('LOG', new Date().toISOString(),'MYSQL|RELEASE',4, 'Err RELEASE:',err.toString());
    }
});