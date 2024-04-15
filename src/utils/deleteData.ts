import { client } from "./sanityClient";
import ProgressBar from "progress";

type DocumentType = "location" | "municipality" | "county";
interface DocumentWithReferences {
  _id: string;
  _type: string;
}

const MAX_RETRIES = 3;

async function removeAllReferencedDocs(typesToRemove: DocumentType[]) {
  const bar = new ProgressBar("Removing [:bar] :percent :etas", {
    total: typesToRemove.length,
    width: 40,
  });

  for (const type of typesToRemove) {
    let attempts = 0;
    while (attempts < MAX_RETRIES) {
      try {
        // First, fetch all documents that reference the types to be removed
        const refsToRemoveQuery = `*[_type != "${type}" && references(*[_type == "${type}"]._id)]{_id, _type}`;
        const docsToUpdate = await client.fetch(refsToRemoveQuery);

        const transaction = client.transaction();

        // Unset references in all fetched documents
        docsToUpdate.forEach((doc: DocumentWithReferences) => {
          const pathToUpdate = determineReferencePath(doc._type, type);
          if (pathToUpdate) {
            transaction.patch(doc._id, (patch) => patch.unset([pathToUpdate]));
          }
        });

        await transaction.commit();

        // Now, fetch IDs of documents to delete
        const docsToDeleteQuery = `*[_type == "${type}"]._id`;
        const docsToDelete = await client.fetch(docsToDeleteQuery);

        // Delete documents
        const deleteTransaction = client.transaction();
        docsToDelete.forEach((docId: string) => {
          deleteTransaction.delete(docId);
        });

        const response = await deleteTransaction.commit();
        console.log(
          `Successfully removed all documents of type ${type}.`,
          response,
        );
        bar.tick();
        break; // Exit the loop on successful deletion
      } catch (error) {
        attempts++;
        console.error(`Attempt ${attempts} failed:`, error);
        if (attempts >= MAX_RETRIES) {
          console.error(
            `Max retries reached for type ${type}. Skipping to next type.`,
          );
          bar.tick();
          break; // Break the loop after max retries
        }
      }
    }
  }
}

function determineReferencePath(
  docType: string,
  refType: DocumentType,
): string | null {
  // Define the paths based on document and reference types
  switch (docType) {
    case "someDocType":
      return refType === "location" ? "location" : null; // Add other conditions as needed
    default:
      return null; // Return null if no path is determined
  }
}

// Example usage
removeAllReferencedDocs(["location", "municipality", "county"]);
