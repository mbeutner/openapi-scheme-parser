#!/usr/bin/env node
import { readFile, writeFile } from 'fs'
import {OpenAPIV3, OpenAPIV3_1} from 'openapi-types'
import ComponentsObject = OpenAPIV3.ComponentsObject;
import SchemaObject = OpenAPIV3.SchemaObject;
import ReferenceObject = OpenAPIV3_1.ReferenceObject;
interface Args {
  filePath: string
  outputPath: string
}

export async function generateSchema(params: Args): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let openApiConf: ComponentsObject
    try {
      openApiConf = await extractSchemaFromFile(params.filePath)
      const fileContent = createInterfaceString(openApiConf.schemas)
      createFileOutput(params.outputPath, fileContent)
      resolve('extraction of component schemes was successful')
    } catch (err) {
      reject(`Error occurred while reading file: ${err}`)
    }
  })
}

function extractSchemaFromFile(filePath: string): Promise<ComponentsObject> {
  return new Promise((resolve, reject) => {
    readFile(filePath, (err: any, data: any) => {
      if (err) {
        reject(err)
      }

      let schema
      try {
        const dec = new TextDecoder()
        schema = JSON.parse(dec.decode(data))?.components as ComponentsObject
        resolve(schema)
      } catch (err) {
        reject(`Error occurred while parsing the json: ${err}`)
      }
    })
  })
}

function createInterfaceString(openApiConf: SchemaObject | undefined): string {
  let result = ''
  if (!openApiConf) {
    return result
  }

  let key: keyof SchemaObject
  for (key in openApiConf) {
    result += `export interface ${key} {\n`
    const item: any = openApiConf[key]
    for (const propertyName in item.properties) {
      const property: SchemaObject = item.properties[propertyName]
      result += addDescription(property)
      if (item.required?.includes(propertyName)) {
        result += `  ${propertyName}: ${mapPropertyTypes(property)}\n`
      } else {
        result += `  ${propertyName}?: ${mapPropertyTypes(property)}\n`
      }
    }
    result += '}\n\n'
  }
  return result
}

function addDescription(property: SchemaObject): string {
  if (property.description && !property.example) {
    return `  /** ${property.description} **/\n`
  }
  if (!property.description && property.example) {
    return `  /** Example ${property.example} **/\n`
  }
  if (property.description && property.example) {
    return `  /**\n   * ${property.description}\n   * @example ${property.example}\n   */\n`
  }
  return ''
}

function mapPropertyTypes(property: SchemaObject | ReferenceObject): string {
  let result = ''
  if (!('type' in property)) {
    return result
  }

  switch (property.type) {
    case 'integer':
      result += 'number'
      break
    case 'array':
      if (property.items) {
        if ('type' in property.items) {
          result += `${mapPropertyTypes(property.items)}[]`
          break
        }
        if ('$ref' in property.items) {
          const parts: string[] = property.items?.$ref.split('/')
          result += `${parts[parts.length - 1]}[]`
          break
        }
      }
      if (property.type) {
        result += property.type
        break
      }
      break
    default:
      if ('$ref' in property) {
        break
      }
      result += property.type
      break
  }

  if (property.nullable) {
    result += ' | null'
  }
  return result
}

function createFileOutput(outputPath: string, content: string): void {
  writeFile(outputPath, content, (err: any) => {
    if (err) {
      console.info(err)
    }
  })
}
