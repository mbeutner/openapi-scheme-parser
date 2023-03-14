#!/usr/bin/env node

import { readFile, writeFile } from 'fs'
import * as process from 'process'
import * as Process from "process";

class CustomError extends Error {
  message: string
  constructor(message: string) {
    super()
    this.message = message
  }
}

interface Args {
  filePath: string
  outputPath: string
}

export async function generateSchema(params: Args): Promise<string> {
  return new Promise(async (resolve) => {
    const openApiConf: any = await extractSchemaFromFile(params.filePath)
    const fileContent = createInterfaceString(openApiConf)
    createFileOutput(params.outputPath, fileContent)
    resolve('extraction of component schemes was successful')
  })
}

function extractSchemaFromFile(filePath: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    readFile(filePath, (err: any, data: any) => {
      if (err) {
        reject(err)
      }
      const dec = new TextDecoder()
      const schema = JSON.parse(dec.decode(data))?.components?.schemas
      resolve(schema)
    })
  })
}

function createInterfaceString(openApiConf: any): string {
  let result = ''
  for (const key in openApiConf) {
    result += `export interface ${key} {\n`
    const item = openApiConf[key]
    for (const propertyName in item.properties) {
      const property = item.properties[propertyName]
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

function addDescription(property: { description?: string, example?: string }): string {
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

type PropertyItems = {
  type: string
  $ref: undefined
} | {
  type: undefined
  $ref: string
}

function mapPropertyTypes(property: { type: string, items?: PropertyItems }): string {
  switch (property.type) {
    case 'integer':
      return 'number'
    case 'array':
      if (property.items?.type !== undefined) {
        return `${mapPropertyTypes(property.items)}[]`
      }
      if (property.items?.$ref) {
        const parts: string[] = property.items?.$ref.split('/')
        return `${parts[parts.length - 1]}[]`
      }
      return property.type
    default:
      return property.type
  }
}

function createFileOutput(outputPath: string, content: string): void {
  writeFile(outputPath, content, (err: any) => {
    if (err) {
      console.log(err)
    }
  })
}
