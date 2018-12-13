const fetch = require('node-fetch');
var fs = require('file-system');

class Comprou{
    constructor(event, timestamp, revenue, key1, value1, key2, value2){
        this.event = event; //---------- event
        this.timestamp = timestamp; //-- timestamp
        this.revenue = revenue; //----- revenue
        this.key1 = key1; //------------ store_name
        this.value1 = value1; //-------- value (store_name)
        this.key2 = key2; //------------ transaction_id
        this.value2 = value2; //-------- value (transaction_id)
    }
}
class ComprouProduto{
    constructor(event, timestamp, key1, value1, key2, value2, key3, value3){
        this.event = event; //--------- event
        this.timestamp = timestamp; //- timestamp
        this.key1 = key1; //----------- product_name
        this.value1 = value1; //------- value (product_name)
        this.key2 = key2; //----------- transaction_id
        this.value2 = value2; //------- value (transaction_id)
        this.key3 = key3; //----------- product_price
        this.value3 = value3; //------- value (product_price)
    }
}

class TimelineEvent{
    constructor( timestamp, revenue, transaction_id, store_name,){
        this.timestamp = timestamp;
        this.revenue = revenue;
        this.transaction_id = transaction_id;
        this.store_name = store_name;
    }
}

// Funcao auxiliar para formatação do JSON
function formatJSON (data) {
    const object = {
        event: data.event,
        timestamp: data.timestamp,
        revenue: data.revenue
    };
    for (const customData of data.custom_data) {
        object[customData.key] = customData.value;
    }
    return object;
}

function timeLine( comprou , comprou_produto ){
    var finalJSON = {"timeline": [{}]};

    // Ordenar por timestamp decrescente
    comprou.sort(function(a,b) {
        return a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0;
    });

    for ( i in comprou ){
        var tLine = {};
        var product_index = 0;

        // Registrando timestamp e revenue da compra
        tLine['timestamp'] = comprou[i].timestamp;
        tLine['revenue'] = comprou[i].revenue;
        tLine['products'] = [{}];
        

        // Registrando transaction_id e store_name da compra
        for(j in comprou_produto){
            tLine['products'][product_index] = {};
            if(comprou[i].value2 == comprou_produto[j].value2){
                tLine['transaction_id'] = comprou_produto[j].value2;
                tLine['store_name'] = comprou[i].value1;
                
                tLine['products'][product_index]['name'] = comprou_produto[j].value1;
                tLine['products'][product_index]['price'] = comprou_produto[j].value3;
                product_index++;
                
            }
            
        }
        finalJSON.timeline[i] = tLine;
    }
    var fim = JSON.stringify(finalJSON);
    
    // Cria o arquivo JSON na pasta principal do projeto
    fs.writeFile("timeline.json", fim);
    
    //console.log(fim);
}

// Utilizando API fetch para buscar JSON por URL
fetch('https://storage.googleapis.com/dito-questions/events.json')
    .then(res => res.json())
    .then(json => {

    var novoJSON = json.events;
    var comprou = [], comprou_i=0;
    var comprou_produto = [], comprou_produto_i=0;
    
    // Organizando arquivo JSON nos vetores comprou e comprou_produto
    for (var i = 0; i < novoJSON.length; i++) {
        if(novoJSON[i].event == "comprou"){
            // Verificando ondem as informações no arquivo
            if(novoJSON[i].custom_data[0].key == "store_name"){
                comprou[comprou_i] = new Comprou(
                    novoJSON[i].event,
                    novoJSON[i].timestamp,
                    novoJSON[i].revenue,
                    novoJSON[i].custom_data[0].key,
                    novoJSON[i].custom_data[0].value,
                    novoJSON[i].custom_data[1].key,
                    novoJSON[i].custom_data[1].value
                );
                comprou_i++; 
            }else if(novoJSON[i].custom_data[0].key == "transaction_id"){
                comprou[comprou_i] = new Comprou(
                    novoJSON[i].event,
                    novoJSON[i].timestamp,
                    novoJSON[i].revenue,
                    novoJSON[i].custom_data[1].key,
                    novoJSON[i].custom_data[1].value,
                    novoJSON[i].custom_data[0].key,
                    novoJSON[i].custom_data[0].value
                );
                comprou_i++;
                }
        }
        else if(novoJSON[i].event == "comprou-produto"){
            // Ordenando product_name, transaction_id, product_price
            var product_name, transaction_id, product_price;
            var product_name_value, transaction_id_value, product_price_value;
            for(j=0; j<3; j++){
                // Verificando ondem as informações no arquivo
                switch(novoJSON[i].custom_data[j].key){
                    case "product_name":
                        product_name = novoJSON[i].custom_data[j].key;
                        product_name_value = novoJSON[i].custom_data[j].value;
                        break;
                    case "transaction_id":
                        transaction_id = novoJSON[i].custom_data[j].key;
                        transaction_id_value = novoJSON[i].custom_data[j].value;
                        break;
                    case "product_price":
                        product_price = novoJSON[i].custom_data[j].key;
                        product_price_value = novoJSON[i].custom_data[j].value;
                        break;
                }    
            }
            comprou_produto[comprou_produto_i] = new ComprouProduto(
                novoJSON[i].event,
                novoJSON[i].timestamp,
                product_name,
                product_name_value,   
                transaction_id,
                transaction_id_value,
                product_price,
                product_price_value
            );
            comprou_produto_i++;
        }
    
    }

    // Criando timeline
    timeLine( comprou , comprou_produto );

});