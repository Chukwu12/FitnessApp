// import OpenAI from "openai";

// const opeanai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// export async function POST(request: Request) {
//   const { exerciseName } = await request.json();

//   if (!exerciseName) {
//     return Response.json(
//       { error: "Exercise name is required" },
//       { status: 400 }
//     );
//   }

//   const prompt = `You are a fitness coach. You are given an exercise, provide clear instructions on how to perform the exercise. Include if any equipments is required.
//   Explain the exercise in details and for a begineer.
//   the exercise name is: ${exerciseName}
//   keep it short and concise. Use markdown formatting.
//   Use the following format:
//   ## Equipment required
//   ## instructions
//   ### Tips
//    ### Variations
//    ### Safety
//    keep spacing between the headings and the content.
//    Always use headings and subheadings`;

//   console.log(prompt);

//   try {
//     const response = await opeanai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [{ role: "user", content: prompt }],
//     });

//     console.log(response);
//     return Response.json({ message: response.choices[0].message.content });
//   } catch (error) {
//     console.error("Error fetching AI guidance", error);
//     return Response.json(
//       { error: "Error fetching AI guidance" },
//       { status: 500 }
//     );
//   }
// }
