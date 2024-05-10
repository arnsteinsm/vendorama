import { client as sanityClient } from "../sanityClient";
import ProgressBar from "progress";
import { Transaction } from "@sanity/client";

interface DocumentWithRef {
  _id: string;
  _type: string;
}

const MAX_RETRIES = 3;

export async function removeAllReferencedDocs(typesToRemove: string[]) {
  const bar = new ProgressBar("Removing [:bar] :percent :etas", {
    total: typesToRemove.length,
    width: 40,
  });

  for (const type of typesToRemove) {
    let attempts = 0;
    while (attempts < MAX_RETRIES) {
      try {
        const refsToRemoveQuery = `*[_type != "${type}" && references(*[_type == "${type}"]._id)]`;
        const docsToUpdate: DocumentWithRef[] =
          await sanityClient.fetch(refsToRemoveQuery);
        const transaction: Transaction = sanityClient.transaction();
        docsToUpdate.forEach((doc: DocumentWithRef) => {
          const paths = findReferencePaths(doc, type);
          paths.forEach((path: string) =>
            transaction.patch(doc._id, (patch: any) => patch.unset([path])),
          );
        });
        await transaction.commit();

        const docsToDeleteQuery = `*[_type == "${type}"]{_id}`;
        const docsToDelete = await sanityClient.fetch(docsToDeleteQuery);
        const deleteTransaction = sanityClient.transaction();
        docsToDelete.forEach((doc) => deleteTransaction.delete(doc._id));
        await deleteTransaction.commit();
        console.log(`Successfully removed all documents of type ${type}.`);
        bar.tick();
        break;
      } catch (error) {
        console.error(
          `Attempt ${attempts + 1} failed for type ${type}:`,
          error,
        );
        attempts++;
        if (attempts >= MAX_RETRIES) {
          console.error(
            `Max retries reached for type ${type}. Moving to next type.`,
          );
          bar.tick();
          break;
        }
      }
    }
  }
}

function findReferencePaths(doc: DocumentWithRef, type: string): string[] {
  const paths: string[] = [];
  if (doc._type === "county" && type === "municipality")
    paths.push("municipalities");
  else if (doc._type === "municipality" && type === "county")
    paths.push("county");
  else if (doc._type === "vendor" && type === "location")
    paths.push("location");
  else if (
    doc._type === "location" &&
    (type === "municipality" || type === "county")
  )
    paths.push(type);
  return paths;
}

// Example usage:
removeAllReferencedDocs(["location", "municipality", "county"]);
