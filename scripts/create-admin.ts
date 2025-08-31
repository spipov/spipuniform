/** biome-ignore-all lint/suspicious/noConsole: Console logs in CLI tools are acceptable */

import { signUp } from '@/lib/auth-client';
import { registerSchema } from '@/schemas/auth';
import prompts from 'prompts';

(async () => {
    const response = await prompts(
        [
            {
                type: 'text',
                name: 'email',
                message: 'Enter admin email',
            },
            {
                type: 'text',
                name: 'name',
                message: 'Enter admin name',
            },
            {
                type: 'password',
                name: 'password',
                message: 'Enter admin password',
            },
            {
                type: 'password',
                name: 'confirmPassword',
                message: 'Confirm admin password',
            },
        ],
        {
            onCancel: () => {
                console.log('Admin creation cancelled.');
                process.exit(0);
            },
        }
    );

    if (response.password !== response.confirmPassword) {
        console.error('Passwords do not match.');
        process.exit(1);
    }

    const parsed = registerSchema.safeParse(response);
    if (!parsed.success) {
        console.error('Validation errors:');
        parsed.error.issues.forEach((issue) => {
            console.error(`- ${issue.path.join('.')}: ${issue.message}`);
        });
        process.exit(1);
    }

    try {
        const result = await signUp.email({
            email: parsed.data.email,
            password: parsed.data.password,
            name: parsed.data.name,
        });

        if (result.error) {
            console.error(`Failed to create admin user: ${result.error.message}`);
            process.exit(1);
        } else {
            console.log(
                `Admin user created successfully: ${parsed.data.email}`
            );
            process.exit(0);
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(`An unexpected error occurred: ${error.message}`);
        } else {
            console.error('An unexpected error occurred.');
        }
        process.exit(1);
    }
})();