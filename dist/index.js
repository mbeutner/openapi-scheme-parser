#!/usr/bin/env node
import { readFile, writeFile } from 'fs';
export async function generateSchema(params) {
    return new Promise(async (resolve, reject) => {
        let openApiConf;
        try {
            openApiConf = await extractSchemaFromFile(params.filePath);
            const fileContent = createInterfaceString(openApiConf.schemas);
            createFileOutput(params.outputPath, fileContent);
            resolve('extraction of component schemes was successful');
        }
        catch (err) {
            reject(`Error occurred while reading file: ${err}`);
        }
    });
}
function extractSchemaFromFile(filePath) {
    return new Promise((resolve, reject) => {
        readFile(filePath, (err, data) => {
            if (err) {
                reject(err);
            }
            let schema;
            try {
                const dec = new TextDecoder();
                schema = JSON.parse(dec.decode(data))?.components;
                resolve(schema);
            }
            catch (err) {
                reject(`Error occurred while parsing the json: ${err}`);
            }
        });
    });
}
function createInterfaceString(openApiConf) {
    let result = '';
    if (!openApiConf) {
        console.info('hier läuft was schief');
        return result;
    }
    let key;
    for (key in openApiConf) {
        console.log(`SchemaKey => ${key}`);
        result += `export interface ${key} {\n`;
        const item = openApiConf[key];
        for (const propertyName in item.properties) {
            console.log(`PropertyName => ${propertyName}`);
            const property = item.properties[propertyName];
            result += addDescription(property);
            if (item.required?.includes(propertyName)) {
                result += `  ${propertyName}: ${mapPropertyTypes(property)}\n`;
            }
            else {
                result += `  ${propertyName}?: ${mapPropertyTypes(property)}\n`;
            }
        }
        result += '}\n\n';
    }
    return result;
}
function addDescription(property) {
    if (property.description && !property.example) {
        return `  /** ${property.description} **/\n`;
    }
    if (!property.description && property.example) {
        return `  /** Example ${property.example} **/\n`;
    }
    if (property.description && property.example) {
        return `  /**\n   * ${property.description}\n   * @example ${property.example}\n   */\n`;
    }
    return '';
}
function mapPropertyTypes(property) {
    let result = '';
    if (!('type' in property)) {
        console.log({ property });
        return result;
    }
    switch (property.type) {
        case 'integer':
            result += 'number';
            break;
        case 'array':
            if ('items' in property) {
                if ('type' in property.items) {
                    result += `${mapPropertyTypes(property.items)}[]`;
                    break;
                }
                if ('$ref' in property.items) {
                    const parts = property.items?.$ref.split('/');
                    result += `${parts[parts.length - 1]}[]`;
                    break;
                }
            }
            if ('type' in property) {
                result += property.type;
                break;
            }
            break;
        default:
            if ('$ref' in property) {
                break;
            }
            result += property.type;
            break;
    }
    if ('nullable' in property) {
        result += ' | null';
    }
    return result;
}
function createFileOutput(outputPath, content) {
    writeFile(outputPath, content, (err) => {
        if (err) {
            console.log(err);
        }
    });
}
//# sourceMappingURL=index.js.map