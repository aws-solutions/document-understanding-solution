
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

from elasticsearch import Elasticsearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth
import boto3
import re
import datetime

ES_HIGHLIGHT_FRAGMENT_SIZE = 100

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

        if es.exists(index="textract", id=documentId):
            es.delete(index="textract", id=documentId)
            print("Deleted document: {}".format(documentId))


def calculate_date_matches(document,date_to,date_from):
    match_count = 0
    if 'date' in document.keys():
        dates_in_document = document['date']
        for date in dates_in_document:
            if (date_from <= datetime.datetime.strptime(date,"%Y-%m-%d") <= date_to):
                match_count +=1
    return match_count

def search(request):

    host = request["elasticsearchDomain"]
    keyword = request["keyword"] if "keyword" in request else None
    documentId = request["documentId"] if "documentId" in request else None

    output = request

    # extract the dates that the user wants to query
    if 'date:' in keyword:
        date_range = re.findall(r'date:\'\[\d{4}-\d{2}-\d{2} TO \d{4}-\d{2}-\d{2}\]\'',keyword)
        # for cases where user has input a single date
        if len(date_range)< 1:
            date = re.findall(r'date:\'\[(\d{4}-\d{2}-\d{2})\]\'',keyword)
            if len(date)< 1:
                raise ValueError("Invalid Search. Date search should be in format date:'[YYYY-mm-dd TO YYYY-mm-dd]' or date:'[YYYY-mm-dd]'")
            elif len(date) == 1:
                date_from = date_to = datetime.datetime.strptime(date[0],"%Y-%m-%d")
                keyword = re.sub(r'date:\'\[\d{4}-\d{2}-\d{2}\]\'',str(date[0])+" TO "+str(date[0]),keyword)
            elif len(date) > 1 :
                raise ValueError("Searching for multiple dates at a time is not permitted. Use a date range instead.")
        elif len(date_range)==1:
            # for cases where a range of date is provided by user
            date_range = re.findall(r'date:\'\[(\d{4}-\d{2}-\d{2} TO \d{4}-\d{2}-\d{2})\]\'',keyword)[0]
            date_from = datetime.datetime.strptime(date_range.split(" TO ")[0],"%Y-%m-%d")
            date_to = datetime.datetime.strptime(date_range.split(" TO ")[1],"%Y-%m-%d")
        elif len(date_range) > 1:
            raise ValueError("Searching for multiple date ranges at a time is not permitted")


    if(keyword is not None):
        searchBody = {
                 "query" : {
                    "query_string": {
                        "query": keyword
                       }
                  },
                  "highlight" : {
                    "fields" : {
                        "content" : { "pre_tags" : [""], "post_tags" : [""] },
                      },
                      "fragment_size" : ES_HIGHLIGHT_FRAGMENT_SIZE,
                      "require_field_match": False
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
            body=searchBody,
            _source = True,
            filter_path=['hits.hits._id', 'hits.hits._source','hits.hits.highlight']
        )

        if("hits" in output):
            output = output["hits"]
            # subnested hits
            hits = output["hits"]
            results = []

            for hit in hits:
                id = hit["_id"]
                source = hit["_source"]
                date_match_count = 0
                # calculate only if date is present in the search query
                if "date" in keyword:
                    date_match_count = calculate_date_matches(source,date_to,date_from)
                # decide the match count and lines to be displayed based on whether content was
                # highlighted in the query or not
                if "highlight" in hit.keys():
                    content_match_count = len(hit["highlight"]["content"]) + date_match_count
                    lines = hit["highlight"]["content"]
                else:
                    content_match_count = date_match_count
                    lines = [source["content"][10:100]]
                obj = {
                    "documentId": id,
                    "name": source["name"],
                    "bucket": source["bucket"],
                    "count": content_match_count,
                    "lines": lines
                }
                results.append(obj)
            output = results
        return output
