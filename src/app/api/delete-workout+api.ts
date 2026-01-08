import { adminClient } from "@/lib/client";

export async function POST (request: Request) {
    const {workoutId}: {workoutId: string} = await request.json();

    try {
        await adminClient.delete(workoutId as string);

        console.log('Workout deleted sucessfully', workoutId);

        return Response.json({
            success: true,
            message: 'Workout deleted successfully',
        });
} catch (error) {
    console.error('Error saving workout', error);
    return Response.json({error: 'Failed to save workout'}, {status: 500});
}
}