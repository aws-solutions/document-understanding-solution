import { createAction } from "redux-actions";
import { either, isEmpty, isNil, lensPath, reject, view } from "ramda";
import { normalize } from "normalizr";
import { API, Storage, Auth } from "aws-amplify";
import uuid from "uuid/v4";

import {
  SUBMIT_DOCUMENTS,
  SUBMIT_DOCUMENT,
  FETCH_DOCUMENTS,
  FETCH_DOCUMENT,
  REDACT_DOCUMENT,
  HIGHLIGHT_DOCUMENT
} from "../../../constants/action-types";
import { documentsSchema, documentSchema } from "./data";

const lensNextToken = lensPath(["data", "nextToken"]);
const lensDocumentsTotal = lensPath(["data", "Total"]);
const lensDocumentsData = lensPath(["data", "documents"]);
const lensDocumentData = lensPath(["data"]);

export const submitDocument = createAction(
  SUBMIT_DOCUMENT,
  async ({ sample, key }) => {
    const response = await API.post("TextractDemoTextractAPI", "document", {
      headers: {
        Authorization: `Bearer ${(await Auth.currentSession())
          .getIdToken()
          .getJwtToken()}`
      },
      response: true,
      body: {
        sample: !!sample,
        key
      }
    });

    const data = view(lensDocumentData, response);
    return data;
  }
);

export const submitDocuments = createAction(
  SUBMIT_DOCUMENTS,
  async ({ objects }) => {
    const response = await API.post("TextractDemoTextractAPI", "document", {
      headers: {
        Authorization: `Bearer ${(await Auth.currentSession())
          .getIdToken()
          .getJwtToken()}`
      },
      response: true,
      body: {
        objects
      }
    });

    const data = view(lensDocumentData, response);
    return data;
  }
);

/**
 * Get documents from TextractDemoTextractAPIs
 */
export const fetchDocuments = createAction(
  FETCH_DOCUMENTS,
  async ({ nextToken: nexttoken } = {}) => {
    const response = await API.get("TextractDemoTextractAPI", "documents", {
      headers: {
        Authorization: `Bearer ${(await Auth.currentSession())
          .getIdToken()
          .getJwtToken()}`
      },
      response: true,
      queryStringParameters: reject(either(isNil, isEmpty), {
        nexttoken,
        type: "user"
      })
    });
    const documentsNextToken = view(lensNextToken, response) || null;
    const documentsTotal = view(lensDocumentsTotal, response);
    const documents = view(lensDocumentsData, response).map(document => ({
      ...document,
      documentName: document.objectName.replace(/^.*\//, "")
    }));
    const { entities } = normalize(documents, documentsSchema);
    const meta = reject(isNil, { documentsNextToken, documentsTotal });
    return { ...entities, meta };
  }
);

export const fetchSingleDocument = createAction(
  FETCH_DOCUMENT,
  async documentid => {
    const response = await API.get("TextractDemoTextractAPI", "document", {
      headers: {
        Authorization: `Bearer ${(await Auth.currentSession())
          .getIdToken()
          .getJwtToken()}`
      },
      response: true,
      queryStringParameters: {
        documentid
      }
    });

    const document = view(lensDocumentData, response);

    return normalize(document, documentSchema).entities;
  }
);

/**
 * Get document from TextractDemoTextractAPI
 */
export const fetchDocument = createAction(FETCH_DOCUMENT, async documentid => {
  const response = await API.get("TextractDemoTextractAPI", "document", {
    headers: {
      Authorization: `Bearer ${(await Auth.currentSession())
        .getIdToken()
        .getJwtToken()}`
    },
    response: true,
    queryStringParameters: {
      documentid
    }
  });

  const document = view(lensDocumentData, response);
  const { documentId, objectName, bucketName } = document;

  // Remove the last slash and everything before it
  const documentName = objectName.replace(/^.*\//, "");

  // Amplify prepends public/ to the path, so we have to strip it
  const documentPublicSubPath = objectName.replace("public/", "");
  const resultDirectory = `${documentId}/output`;
  const textractResponsePath = `${resultDirectory}/textract/response.json`;
  const comprehendMedicalResponsePath = `${resultDirectory}/comprehend/comprehendMedicalEntities.json` 
  const comprehendResponsePath = `${resultDirectory}/comprehend/comprehendEntities.json` 
  
  
  // Get a pre-signed URL for the original document upload
  const [documentData, searchablePdfData] = await Promise.all([
    Storage.get(documentPublicSubPath, {
      bucket: bucketName,
      download: true
    }),
    Storage.get(`${resultDirectory}/searchable-pdf.pdf`, {
      download: true
    })
  ]);

  const documentBlob = new Blob([documentData.Body], {
    type: documentData.contentType
  });
  const searchablePdfBlob = new Blob([searchablePdfData.Body], {
    type: "application/pdf"
  });

  // Get the raw textract response data from a json file on S3
  const s3Response = await Storage.get(textractResponsePath, {
    download: true
  });
  const textractResponse = JSON.parse(
    s3Response.Body ? s3Response.Body.toString() : null
  );

// Get the raw comprehend medical response data from a json file on S3
 const s3ComprehendMedicalResponse = await Storage.get(comprehendMedicalResponsePath, {
  download: true
});
const comprehendMedicalRespone = JSON.parse(
  s3ComprehendMedicalResponse.Body ? s3ComprehendMedicalResponse.Body.toString() : null
);
// Get the raw comprehend response data from a json file on S3
const s3ComprehendResponse = await Storage.get(comprehendResponsePath, {
  download: true
});
const comprehendRespone = JSON.parse(
  s3ComprehendResponse.Body ? s3ComprehendResponse.Body.toString() : null
);

  return normalize(
    {
      ...document,
      documentURL: URL.createObjectURL(documentBlob),
      searchablePdfURL: URL.createObjectURL(searchablePdfBlob),
      documentName,
      textractResponse,
      textractFetchedAt: Date.now(),
      comprehendMedicalRespone,
      comprehendRespone,
      resultDirectory
    },
    documentSchema
  ).entities;

});

export const deleteDocument = createAction(FETCH_DOCUMENT, async documentid => {
  const response = await API.del("TextractDemoTextractAPI", "document", {
    headers: {
      Authorization: `Bearer ${(await Auth.currentSession())
        .getIdToken()
        .getJwtToken()}`
    },
    response: true,
    queryStringParameters: {
      documentid
    }
  });

  return normalize(
    {
      documentId: documentid,
      deleted: true
    },
    documentSchema
  ).entities;
});

export const addRedactions = createAction(
  REDACT_DOCUMENT,
  (documentId, pageNumber, redactions) => {
    const keyedRedactions = redactions.reduce((acc, r) => {
      acc[uuid()] = r;
      return acc;
    }, {});


    return normalize(
      {
        documentId,
        redactions: { [pageNumber]: keyedRedactions }
      },
      documentSchema
    ).entities;
  }
);

export const addHighlights = createAction(
  HIGHLIGHT_DOCUMENT,
  
  (documentId, pageNumber, highlights) => {
    const response = normalize(
      {
        documentId,
        highlights:  highlights
      },
      documentSchema
    ).entities

    return response;
  });


export const clearRedactions = createAction(REDACT_DOCUMENT, documentId => {
  return normalize(
    {
      documentId,
      redactions: false
    },
    documentSchema
  ).entities;
});

export const clearHighlights = createAction(HIGHLIGHT_DOCUMENT, documentId => {
  return normalize(
    {
      documentId,
      highlights: []
    },
    documentSchema
  ).entities;
});
