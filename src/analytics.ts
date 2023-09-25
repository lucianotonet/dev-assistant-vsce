
import { PostHog } from 'posthog-node';

let client: PostHog | undefined = undefined;

// Function to capture events with PostHog
export async function capture(args: any) {
    console.log("Capturing posthog event: ", args);
    if (!client) {
        // Initialize PostHog client
        client = new PostHog(
            'phc_C6OoC4aFJT5MPFaiPXn03FTPHlRZpm7wu4LFOf6GzNg',
            { host: 'https://app.posthog.com' }
        );
    }
    
    // Capture the event
    client?.capture(args);
}
