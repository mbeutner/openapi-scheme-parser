#!/usr/bin/env node
import { readFile, writeFile } from 'fs';
class CustomError extends Error {
    message;
    constructor(message) {
        super();
        this.message = message;
    }
}
export async function generateSchema(params) {
    return new Promise(async (resolve) => {
        const openApiConf = await extractSchemaFromFile(params.filePath);
        const fileContent = createInterfaceString(openApiConf);
        createFileOutput(params.outputPath, fileContent);
        resolve('extraction of component schemes was successful');
    });
}
function extractSchemaFromFile(filePath) {
    return new Promise((resolve, reject) => {
        readFile(filePath, (err, data) => {
            if (err) {
                reject(err);
            }
            const dec = new TextDecoder();
            const schema = JSON.parse(dec.decode(data))?.components?.schemas;
            resolve(schema);
        });
    });
}
function createInterfaceString(openApiConf) {
    let result = '';
    for (const key in openApiConf) {
        result += `export interface ${key} {\n`;
        const item = openApiConf[key];
        for (const propertyName in item.properties) {
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
    switch (property.type) {
        case 'integer':
            return 'number';
        case 'array':
            if (property.items?.type !== undefined) {
                return `${mapPropertyTypes(property.items)}[]`;
            }
            if (property.items?.$ref) {
                const parts = property.items?.$ref.split('/');
                return `${parts[parts.length - 1]}[]`;
            }
            return property.type;
        default:
            return property.type;
    }
}
function createFileOutput(outputPath, content) {
    writeFile(outputPath, content, (err) => {
        if (err) {
            console.log(err);
        }
    });
}
//# sourceMappingURL=index.js.map