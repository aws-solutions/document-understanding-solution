
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

import datetime

UNSUPPORTED_DATE_FORMAT = "UNSUPPORTED_DATE_FORMAT"
DOCTEXT = "docText"
KVPAIRS = "KVPairs"
PUBLIC_PATH_S3_PREFIX= "public/"
SERVICE_OUTPUT_PATH_S3_PREFIX = "output/"
TEXTRACT_PATH_S3_PREFIX = "textract/"
COMPREHEND_PATH_S3_PREFIX = "comprehend/"
BARCODES_PATH_S3_PREFIX = "barcodes/"

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