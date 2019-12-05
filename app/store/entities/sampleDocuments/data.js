import { lensPath } from "ramda";

export const lensSampleDocuments = lensPath([
  "entities",
  "sampleDocuments",
  "single"
]);
export const lensSampleCollections = lensPath([
  "entities",
  "sampleDocuments",
  "collections"
]);

export default {
  single: {
    expense: {
      id: "expense.png",
      object: "public/samples/Misc/expense.png",
      title: "Expense Report",
      previewImage: "/static/images/sample-previews/expense.png"
    },
    employment: {
      id: "employmentapp.pdf",
      object: "public/samples/Research/employmentapp.png",
      title: "Employment App",
      previewImage: "/static/images/sample-previews/employmentapp.png"
    },
    management: {
      id: "management.png",
      object: "public/samples/Misc/management.png",
      title: "Management Report",
      previewImage: "/static/images/sample-previews/management.png"
    }
  },

  collections: {
    finance: {
      id: "finance",
      title: "Finance",
      previewImage: "/static/images/sample-previews/Lacey city bonds.png",
      objects: [
        "public/samples/Finance/Credit Unions.png",
        "public/samples/Finance/Lacey city bonds.png",
        "public/samples/Finance/Spokane accounting.png",
        "public/samples/Finance/USDC balance sheet.png",
        "public/samples/Finance/USDE balance sheet.png"
      ]
    }
  }
};
