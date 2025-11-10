import { defineConfig } from "orval";

export default defineConfig({
  learnup: {
    input: {
      // Target the NestJS Swagger JSON endpoint
      target:
        process.env.API_SPEC_URL || "http://localhost:5000/api/v1/docs-json",
      // Optional: Use a local file for offline/CI generation
      // target: "./api-spec.json",
    },
    output: {
      // Output directory for generated files
      target: "./lib/api/generated/api.ts",
      // Use React Query for data fetching
      client: "react-query",
      // Generate separate files for better organization
      mode: "tags-split",
      // Clean output directory before generation
      clean: true,
      // Override default options
      override: {
        // Use custom fetch instance with auth handling
        mutator: {
          path: "./lib/api/api-client.ts",
          name: "customFetch",
        },
        // React Query configuration
        query: {
          // Use React Query v5
          version: 5,
          // Generate suspense hooks
          useSuspenseQuery: true,
          // Custom options
          options: {
            staleTime: 10000,
          },
        },
        // Transform operation names for better DX
        operations: {
          // Example: rename specific operations
          // "UsersController_findAll": { operationId: "getUsers" }
        },
      },
    },
    hooks: {
      afterAllFilesWrite: "prettier --write",
    },
  },
  // Separate config for facial recognition service
  faceRecognition: {
    input: {
      target:
        process.env.FACE_API_SPEC_URL || "http://localhost:8000/openapi.json",
    },
    output: {
      target: "./lib/api/generated/face-recognition.ts",
      client: "react-query",
      mode: "single",
      clean: false,
      override: {
        mutator: {
          path: "./lib/api/face-recognition-client.ts",
          name: "faceRecognitionFetch",
        },
      },
    },
  },
});
