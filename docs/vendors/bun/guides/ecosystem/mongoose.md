> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Read and write data to MongoDB using Mongoose and Bun

MongoDB and Mongoose work out of the box with Bun. This guide assumes you've already installed MongoDB and are running it as background process/service on your development machine. Follow [this guide](https://www.mongodb.com/docs/manual/installation/) for details.

***

Once MongoDB is running, create a directory and initialize it with `bun init`.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
mkdir mongoose-app
cd mongoose-app
bun init
```

***

Then add Mongoose as a dependency.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun add mongoose
```

***

In `schema.ts` we'll declare and export a simple `Animal` model.

```ts schema.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import * as mongoose from "mongoose";

const animalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    sound: { type: String, required: true },
  },
  {
    methods: {
      speak() {
        console.log(`${this.sound}!`);
      },
    },
  },
);

export type Animal = mongoose.InferSchemaType<typeof animalSchema>;
export const Animal = mongoose.model("Animal", animalSchema);
```

***

Now from `index.ts` we can import `Animal`, connect to MongoDB, and add some data to our database.

```ts index.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import * as mongoose from "mongoose";
import { Animal } from "./schema";

// connect to database
await mongoose.connect("mongodb://127.0.0.1:27017/mongoose-app");

// create new Animal
const cow = new Animal({
  title: "Cow",
  sound: "Moo",
});
await cow.save(); // saves to the database

// read all Animals
const animals = await Animal.find();
animals[0].speak(); // logs "Moo!"

// disconnect
await mongoose.disconnect();
```

***

Let's run this with `bun run`.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run index.ts
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
Moo!
```

***

This is a simple introduction to using Mongoose with TypeScript and Bun. As you build your application, refer to the official [MongoDB](https://www.mongodb.com/docs) and [Mongoose](https://mongoosejs.com/docs/) sites for complete documentation.
