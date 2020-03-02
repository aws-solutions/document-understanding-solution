from elasticsearch import Elasticsearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth
import boto3

ES_HIGHLIGHT_FRAGMENT_SIZE = 50

def deleteESItem(elasticsearchDomain, documentId):
    host = elasticsearchDomain

    if(documentId):
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

        if es.exists(index="textract", doc_type="document", id=documentId):
            es.delete(index="textract", doc_type="document", id=documentId)
            print("Deleted document: {}".format(documentId))


def search(request):

    host = request["elasticsearchDomain"]
    keyword = request["keyword"] if "keyword" in request else None
    documentId = request["documentId"] if "documentId" in request else None

    output = request

    if(keyword is not None):
        searchBody = {
                 "query" : {
                   "match": { "content": keyword }
                  },
                  "highlight" : {
                    "fields" : {
                      "content" : { "pre_tags" : [""], "post_tags" : [""] }
                      },
                      "fragment_size" : ES_HIGHLIGHT_FRAGMENT_SIZE
                 }
            }

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
        
        output = es.search(
            index='textract',
            doc_type="document",
            body=searchBody,
            _source = ["name","bucket"],
            filter_path=['hits.hits._id', 'hits.hits._source','hits.hits.highlight' ]
        )
        
        if("hits" in output):
            output = output["hits"]
            # subnested hits
            hits = output["hits"]
            results = []

            for hit in hits:
                id = hit["_id"]
                source = hit["_source"]
                obj = {
                    "documentId": id,
                    "name": source["name"],
                    "bucket": source["bucket"],
                    "count": len(hit["highlight"]["content"]),
                    "lines":hit["highlight"]["content"]
                }
                results.append(obj)
            output = results

        return output
