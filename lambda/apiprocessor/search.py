from elasticsearch import Elasticsearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth
import boto3
import re

def context (term, phrase):
  regex = r"(.*)"+term+"(.*)"

  matches = re.finditer(regex, phrase)

  matchList = []

  for matchNum, match in enumerate(matches, start=1):
      matchList.append(match.group())

  return matchList

def contextCounts (term, phrase):

  return len(re.findall(term, phrase))

def deleteESItem(elasticsearchDomain, documentId):
    host = elasticsearchDomain

    if(documentId):
        service = 'es'
        ss = boto3.Session()
        credentials = ss.get_credentials()
        region = ss.region_name

        awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)

        es = Elasticsearch(
            hosts = [{'host': host, 'port': 443}],
            http_auth = awsauth,
            use_ssl = True,
            verify_certs = True,
            connection_class = RequestsHttpConnection
        )

        es.delete(index="textract", doc_type="document", id=documentId)

        print("Deleted document: {}".format(documentId))


def search(request):

    host = request["elasticsearchDomain"]
    keyword = request["keyword"] if "keyword" in request else None
    documentId = request["documentId"] if "documentId" in request else None


    output = request

    if(keyword is not None):
        searchBody = {
            "must": [
                {
                    "match": {
                        "content": keyword
                    }
                }
            ]
        }


        if(documentId is not None):
            searchBody["must"].append(
                {
                    "match_phrase":
                    {
                        "documentId": documentId
                    }
                }
            )

        service = 'es'
        ss = boto3.Session()
        credentials = ss.get_credentials()
        region = ss.region_name

        awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)

        print(searchBody)

        es = Elasticsearch(
            hosts = [{'host': host, 'port': 443}],
            http_auth = awsauth,
            use_ssl = True,
            verify_certs = True,
            connection_class = RequestsHttpConnection
        )
        output = es.search(
          index='textract',
          doc_type="document",
          body = {
            "query": {
              "bool": searchBody
            }
          }
        )


        if("hits" in output):
            output = output["hits"]
            # subnested hits
            hits = output["hits"]
            results = []

            i = 0
            while i < len(hits):
                id = hits[i]["_id"]
                source = hits[i]["_source"]
                linesContext = context(keyword, source["content"])
                joined = ' ...'.join(linesContext)
                obj = {
                    "documentId": id,
                    "name": source["name"],
                    "bucket": source["bucket"],
                    "count": contextCounts(keyword, source["content"]),
                    "brief": joined[:400],
                    "lines": linesContext
                }
                results.append(obj)
                i += 1
                if('documentId' in request):
                    if(request['documentId'] == id):
                        results = obj
                        i = len(hits)


            output = results

        return output
