import json
from helper import FileHelper, S3Helper
from trp import *
from elasticsearch import Elasticsearch, RequestsHttpConnection, client
from requests_aws4auth import AWS4Auth
import boto3
import datetime

UNSUPPORTED_DATE_FORMAT = "UNSUPPORTED_DATE_FORMAT"
DOCTEXT = "docText"
KVPAIRS = "KVPairs"

def round_floats(o):
    if isinstance(o, float):
        return round(o, 4)
    if isinstance(o, dict):
        return {k: round_floats(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [round_floats(x) for x in o]
    return o


def prune_blocks(o):
    if(not isinstance(o, list)):
        ol = []
        ol.append(o)
        o = ol

    for page in o:
        for block in page['Blocks']:
            if 'Geometry' in block:
                del block['Geometry']['Polygon']

    return o

# This function will convert all the dates to a given format so as to enable search in an easy way for the users
def format_date(date):
    date_patterns = ["%m/%d/%Y", "%m-%d-%Y", "%B %Y", "%b %Y", "%m/%d/%y", "%B, %Y", "%Y", "%d-%m-%Y", "%B %d, %Y", "%b %d, %Y", "%Y."]
    for pattern in date_patterns:
        try:
            return datetime.datetime.strptime(date,pattern)
        except:
            pass
    print("Date format not matched {}".format(date))
    return UNSUPPORTED_DATE_FORMAT

class OutputGenerator:
    def __init__(self, documentId, response, bucketName, objectName, forms, tables, ddb, elasticsearchDomain=None):
        self.documentId = documentId
        self.response = response
        self.bucketName = bucketName
        self.objectName = objectName
        self.forms = forms
        self.tables = tables
        self.ddb = ddb
        self.elasticsearchDomain = elasticsearchDomain

        self.outputPath = "{}-analysis/{}/".format(objectName, documentId)

        self.document = Document(self.response)

    def saveItem(self, pk, sk, output):

        jsonItem = {}
        jsonItem['documentId'] = pk
        jsonItem['outputType'] = sk
        jsonItem['outputPath'] = output

        ddbResponse = self.ddb.put_item(Item=jsonItem)

    def _outputText(self, page, p):
        text = page.text
        opath = "{}page-{}-text.txt".format(self.outputPath, p)
        S3Helper.writeToS3(text, self.bucketName, opath)
        self.saveItem(self.documentId, "page-{}-Text".format(p), opath)

        textInReadingOrder = page.getTextInReadingOrder()
        opath = "{}page-{}-text-inreadingorder.txt".format(self.outputPath, p)
        S3Helper.writeToS3(textInReadingOrder, self.bucketName, opath)
        self.saveItem(self.documentId,
                      "page-{}-TextInReadingOrder".format(p), opath)

    def _outputForm(self, page, p):
        csvData = []
        key_value_pairs = {}
        for field in page.form.fields:
            csvItem = []
            if(field.key):
                csvItem.append(field.key.text)
            else:
                csvItem.append("")
            if(field.value):
                csvItem.append(field.value.text)
            else:
                csvItem.append("")
            csvData.append(csvItem)
            if ":" in csvItem[0]:
                csv_key = csvItem[0].split(":")[0]
            else:
                csv_key = csvItem[0]
            key_value_pairs[csv_key] = csvItem[1]
        csvFieldNames = ['Key', 'Value']
        opath = "{}page-{}-forms.csv".format(self.outputPath, p)
        S3Helper.writeCSV(csvFieldNames, csvData, self.bucketName, opath)
        self.saveItem(self.documentId, "page-{}-Forms".format(p), opath)
        return key_value_pairs

    def _outputTable(self, page, p):

        csvData = []
        for table in page.tables:
            csvRow = []
            csvRow.append("Table")
            csvData.append(csvRow)
            for row in table.rows:
                csvRow = []
                for cell in row.cells:
                    csvRow.append(cell.text)
                csvData.append(csvRow)
            csvData.append([])
            csvData.append([])

        opath = "{}page-{}-tables.csv".format(self.outputPath, p)
        S3Helper.writeCSVRaw(csvData, self.bucketName, opath)
        self.saveItem(self.documentId, "page-{}-Tables".format(p), opath)

    def indexDocument(self, text, entitiesToIndex):
        
        if(self.elasticsearchDomain):

            host = self.elasticsearchDomain

            if(text):
                service = 'es'
                ss = boto3.Session()
                credentials = ss.get_credentials()
                region = ss.region_name

                awsauth = AWS4Auth(credentials.access_key, credentials.secret_key,
                                region, service, session_token=credentials.token)

                es = Elasticsearch(
                    hosts=[{'host': host, 'port': 443}],
                    http_auth=awsauth,
                    use_ssl=True,
                    verify_certs=True,
                    connection_class=RequestsHttpConnection
                )

                es_index_client = client.IndicesClient(es)

                document = {
                    "documentId": "{}".format(self.documentId),
                    "name": "{}".format(self.objectName),
                    "bucket": "{}".format(self.bucketName),
                    "content": text
                }

                # add comprehend entities while indexing the document
                for key, val in entitiesToIndex.items():
                    key = key.lower()
                    if(key == "date"):
                        for date in val:
                            date_object = format_date(date)
                            if(date_object!= UNSUPPORTED_DATE_FORMAT):
                                if(key not in document):
                                    document[key] = []
                                document[key].append(date_object.strftime("%Y-%m-%d"))
                        print("Document with Converted dates: {}".format(document))
                    else:
                        document[key] = val
                
                # add the key value pairs to be indexed
                for key, val in key_val_pairs.items():
                    document[key.lower()] = val
                    
                try:
                    if not es_index_client.exists(index='textract'):
                        print("Index 'textract' does not exist, creating...")
                        es_index_client.create(
                            index="textract",
                            body={
                                "settings": {
                                    "index": {
                                        "number_of_shards": 2
                                    }
                                },
                                "mappings":{
                                    "document":{
                                        "properties":{
                                        "date":{ 
                                            "type": "date",
                                            "format": "M'/'dd'/'yyyy||date||year||year_month||dd MMM yyyy||dd'/'MM'/'yyyy||yyyy'/'MM'/'dd||dd'/'MM'/'YY||year_month_day||MM'/'dd'/'yy||dd MMM||MM'/'yyyy||M-dd-yyyy||MM'/'dd'/'yyyy||M||d'/'MM'/'yyyy||MM'/'dd'/'yy"
                                        }
                                    }
                                }
                            }
                        }
                    )

                    es.index(index="textract", doc_type="document",
                            id=self.documentId, body=json.loads(json.dumps(document)))

                    print("Indexed document: {}".format(self.objectName))
                except Exception as E:
                    print("Failed to create index with desired mapping {}".format(E))
        else:
            print("Document not indexed {}".format(self.elasticsearchDomain))

    def run(self):

        if(not self.document.pages):
            return

        opath = "{}response.json".format(self.outputPath)
        S3Helper.writeToS3(json.dumps(round_floats(prune_blocks(
            self.response)), separators=(',', ':')), self.bucketName, opath)
        self.saveItem(self.documentId, 'Response', opath)

        print("Total Pages in Document: {}".format(len(self.document.pages)))

        docText = ""

        p = 1
        for page in self.document.pages:
            docText = docText + page.text + "\n"

            if(self.forms):
                key_val_pairs = self._outputForm(page, p)

            if(self.tables):
                self._outputTable(page, p)

            p = p + 1
        
        return {DOCTEXT: docText, KVPAIRS: key_val_pairs}
