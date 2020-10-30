
######################################################################################################################
 #  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           #
 #                                                                                                                    #
 #  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance    #
 #  with the License. A copy of the License is located at                                                             #
 #                                                                                                                    #
 #      http://www.apache.org/licenses/LICENSE-2.0                                                                    #
 #                                                                                                                    #
 #  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES #
 #  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    #
 #  and limitations under the License.                                                                                #
 #####################################################################################################################

from helper import AwsHelper, DynamoDBHelper
import boto3
import datastore
from helper import S3Helper
import json
import uuid
import csv

def getPageResponse(request):
    documentsTable = request["documentsTable"]
    outputTable = request["outputTable"]
    documentId = request["documentId"]
    page = request["page"]
    ds = datastore.DocumentStore(documentsTable, outputTable)
    doc = ds.getDocument(documentId)
    if(doc and doc["documentStatus"] == "SUCCEEDED"):
        fileName = "{}-analysis/{}/page-{}-response.json".format(doc["objectName"], doc["documentId"], page)
        responseJson = json.loads(S3Helper.readFromS3(doc["bucketName"], fileName))
        doc["textractResponse"] = responseJson
    output = {}
    if(doc):
        output = doc
    return output

def parsePairs(file):
  file = file.splitlines() if type(file) == str else file
  reader = csv.reader(file, delimiter=',')
  ignore = True
  fields = []
  for row in reader:
    if(ignore is True):
      ignore = False
    else:
      fields.append({
        "key": row[0] if len(row) > 0 else '',
        "value": row[1] if len(row) > 1 else '',
      })
  return fields

def getPageForm(request):
    documentsTable = request["documentsTable"]
    outputTable = request["outputTable"]
    documentId = request["documentId"]
    page = request["page"]
    ds = datastore.DocumentStore(documentsTable, outputTable)
    doc = ds.getDocument(documentId)
    if(doc and doc["documentStatus"] == "SUCCEEDED"):
        fileName = "{}-analysis/{}/page-{}-forms.csv".format(doc["objectName"], doc["documentId"], page)
        file = S3Helper.readFromS3(doc["bucketName"], fileName)
        doc["textractResponse"] = parsePairs(file)
    output = {}
    if(doc):
        output = doc
    return output

def getTableFromPath(path):
  pathName = os.getcwd()
  return csv.reader(open(os.path.join(pathName, path), "rU"), delimiter=',')

def getTableFromString(fileStr):
  return csv.reader(fileStr.splitlines(), delimiter=',')

def parseTables(table):
  comprehend = getComprehend()
  tables = []
  tablesIndex = -1
  rowIndex = 1
  for row in table:
    if(len(row) == 1 and row[0] == 'Table'):
      tablesIndex += 1
      rowIndex = 1
      tables.append([])
    else:
      columnIndex = 1
      for cell in row:
        preProcess = {
          "text": cell,
          "comprehend": comprehend["entities"](cell)
        }
        processedLine = processLine(preProcess)
        cellInstance = {
          "RowIndex": rowIndex,
          "ColumnIndex": columnIndex,
          "RowSpan": 1,
          "ColumnSpan": 1,
          "content": cell,
          "tokens": processedLine["phrases"]
        }
        columnIndex += 1
        tables[tablesIndex].append(cellInstance)
  return tables

def getPageTable(request):
    documentsTable = request["documentsTable"]
    outputTable = request["outputTable"]
    documentId = request["documentId"]
    page = request["page"]
    ds = datastore.DocumentStore(documentsTable, outputTable)
    doc = ds.getDocument(documentId)
    if(doc and doc["documentStatus"] == "SUCCEEDED"):
        fileName = "{}-analysis/{}/page-{}-tables.csv".format(doc["objectName"], doc["documentId"], page)
        file = S3Helper.readFromS3(doc["bucketName"], fileName)
        tables = parseTables(getTableFromString(file))
    output = {
      "tables": []
    }
    if(tables):
        output["tables"] = tables
    return output

# Comprehend
def getComprehend(languageCode="en"):
    ss = boto3.Session()
    region = ss.region_name
    client = AwsHelper().getClient('comprehend', region)

    def entities(text):
        return client.detect_entities(
            Text=text,
            LanguageCode=languageCode
        )

    return {
        "entities": entities
    }

def parseKey(obj, key, default):
  return obj[key] if key in obj else default

def parsePhrase(start, end, textString, entity = "null"):
  return {
    "text": textString[slice(start, end)],
    "entity": entity
  }

def processLine(line, entityList={"null":0}):
  text = line["text"]
  comprehend = line["comprehend"] if "comprehend" in line else {}
  entities = comprehend["Entities"] if "Entities" in comprehend else []
  previousEntity = None
  phrases = []
  i = 0
  currentEntity = None
  while(i < len(entities)):
    currentEntity = entities[i]
    if(previousEntity is None and currentEntity["BeginOffset"] != 0):
      phrases.append(parsePhrase(0, currentEntity["BeginOffset"], text))
      entityList["null"] += 1
    elif(previousEntity is not None):
      phrases.append(parsePhrase(previousEntity["EndOffset"], currentEntity["BeginOffset"], text))
      entityList["null"] += 1
    phrases.append(parsePhrase(currentEntity["BeginOffset"], currentEntity["EndOffset"], text, currentEntity["Type"]))
    previousEntity = currentEntity
    if(currentEntity["Type"] not in entityList):
      entityList[currentEntity["Type"]] = 1
    else:
      entityList[currentEntity["Type"]] += 1
    i += 1
  if(currentEntity is not None and len(text)-1 > currentEntity["EndOffset"]):
    phrases.append(parsePhrase(currentEntity["EndOffset"], len(text), text))
    entityList["null"] += 1
  if(currentEntity is None):
    phrases.append(parsePhrase(0, len(text), text))
    entityList["null"] += 1
  return {
    "phrases": phrases,
    "entityList": entityList
  }

def processLines(lines):
  entityList={"null":0}
  processedLines=[]
  i = 0
  while i < len(lines):
    line = processLine(lines[i], entityList)
    entityList = line["entityList"]
    processedLines.append(line["phrases"])
    i += 1
  return {
    "lines": processedLines,
    "entities": entityList
  }

def processPairs(pairs):
  entityList={"null":0}
  processedPairs=[]
  keyList = {}
  i = 0
  while i < len(pairs):
    key = processLine(pairs[i]["key"], entityList)
    entityList = key["entityList"]
    value = processLine(pairs[i]["value"], entityList)
    entityList = value["entityList"]
    keyText = pairs[i]["key"]["text"]
    if(keyText not in keyList):
      keyList[keyText] = 0
    keyList[keyText] += 1
    processedPairs.append({
      "key": {
        "text": keyText,
        "tokens": key["phrases"]
      },
      "value": {
        "tokens": value["phrases"]
      }
    })
    i += 1
  return {
    "pairs": processedPairs,
    "keys": keyList
  }

def table(request):
  return getPageTable(request)

def text(request):
  comprehend = getComprehend()
  document = getPageResponse(request)
  textractResponse = parseKey(document, 'textractResponse', [])
  lines = list(filter(lambda block: block["BlockType"] == "LINE" , textractResponse))
  lines = list(map(lambda line: line["Text"], lines))
  lines = list(map(lambda line: {"text": line, "comprehend": comprehend["entities"](line)}, lines))
  return processLines(lines)

def form(request):
  comprehend = getComprehend()
  document = getPageForm(request)
  textractResponse = parseKey(document, 'textractResponse', [])
  pairs = list(map(lambda pair:
    {"key":
      {
        "text": pair["key"],
        "comprehend": [] if pair["value"] == "" else comprehend["entities"](pair["key"])
      },
      "value":{
        "text": pair["value"],
        "comprehend": [] if pair["value"] == "" else comprehend["entities"](pair["value"])
      }
    }, textractResponse))
  return processPairs(pairs)

# Redaction
def redact(request):
    response = {}
    errors = {}
    params = parseKey(request, "params", {})
    documentId = parseKey(params, "documentId", None)
    page = parseKey(params, "page", 1)
    redactType = parseKey(params, "type", None)
    types = {
      "table": table,
      "text": text,
      "form": form,
    }
    if(documentId is None):
      errors["documentId"] = "no documentId provided in query"
      response["errors"] = errors
      return response
    request["documentId"] = documentId
    request["page"] = page
    if(redactType is not None):
      return types[redactType](request)
    else:
      responses = {}
      for item in types:
        response = types[item](request)
        for property in response:
          responses[property] = response[property]
      return responses
