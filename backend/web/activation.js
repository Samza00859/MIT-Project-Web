// 6-Digit Passcode Input Implementation
// Based on: https://blog.dailysandbox.pro/building-a-6-digit-passcode-input-in-plain-javascript/

const codeActivationWrapper = document.querySelector('.app-code-activation-wrapper');
const resendLink = document.querySelector('.app-code-activation-resend');
const userEmailElement = document.getElementById('user-email');
const numOfFields = 6;

// Get API base URL - uses same origin
function getApiBaseUrl() {
    return window.location.origin;
}

// Extract email from URL parameters
function getEmailFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('email');
}

// Get and set the email address
const userEmail = getEmailFromUrl();
if (userEmail && userEmailElement) {
    userEmailElement.textContent = userEmail;
} else if (!userEmail) {
    // Show error if email is missing
    const emailError = document.getElementById('email-error');
    if (emailError) {
        emailError.style.display = 'block';
    }
    console.error('Email address is required in URL parameter: ?email=user@example.com');
}

// Create input fields dynamically
for (let i = 0; i < numOfFields; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control app-activation-code-input';
    input.maxLength = 1;
    codeActivationWrapper.appendChild(input);
}

const fields = document.querySelectorAll('.app-activation-code-input');

// Handle paste events
fields.forEach((field, index) => {
    field.addEventListener('paste', (event) => {
        event.preventDefault();
        const pasteData = (event.clipboardData || window.clipboardData).getData('text').trim();

        if (/^\d{6}$/.test(pasteData)) {
            // Distribute pasted digits into input fields
            [...pasteData].forEach((char, idx) => {
                if (fields[idx]) fields[idx].value = char;
            });
            fields[5].focus(); // Focus the last field
            verifyActivationCode(Array.from(fields).map((field) => field.value).join(''));
        }
    });
});

// Handle input and navigation
fields.forEach((field, index) => {
    field.addEventListener('input', (event) => {
        // Only allow digits
        const value = event.target.value.replace(/\D/g, '');
        if (value !== event.target.value) {
            event.target.value = value;
        }

        if (field.value && index < fields.length - 1) {
            fields[index + 1].focus();
        }
        checkCompletion(); // Check if all fields are filled
    });

    field.addEventListener('keydown', (event) => {
        if (event.key === 'Backspace' && !field.value && index > 0) {
            fields[index - 1].focus();
        }
        
        // Allow arrow keys for navigation
        if (event.key === 'ArrowLeft' && index > 0) {
            event.preventDefault();
            fields[index - 1].focus();
        }
        if (event.key === 'ArrowRight' && index < fields.length - 1) {
            event.preventDefault();
            fields[index + 1].focus();
        }
    });
});

// Check for completion
const checkCompletion = () => {
    const activationCode = Array.from(fields).map((field) => field.value).join('');
    if (activationCode.length === 6) {
        verifyActivationCode(activationCode);
    }
};

// Verification logic
const verifyActivationCode = async (activationCode) => {
    console.log('Verifying code:', activationCode);

    if (!userEmail) {
        alert('Email address is missing. Please check the URL.');
        return;
    }

    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    document.body.appendChild(spinner);

    try {
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/api/auth/verify-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: userEmail,
                code: activationCode,
            }),
        });

        spinner.remove();

        if (response.ok) {
            const data = await response.json();
            alert('Code verified successfully!');
            // Redirect to success page or login page
            // You can customize this redirect based on your app's flow
            window.location.href = '/web/';
        } else {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
            alert(errorData.detail || 'Invalid code. Try again.');
            fields.forEach((field) => (field.value = ''));
            fields[0].focus();
        }
    } catch (error) {
        spinner.remove();
        console.error('Error verifying code:', error);
        alert('Failed to verify code. Please check your connection and try again.');
        fields.forEach((field) => (field.value = ''));
        fields[0].focus();
    }
};

// Handle resend link
resendLink.addEventListener('click', async (event) => {
    event.preventDefault();

    if (!userEmail) {
        alert('Email address is missing. Please check the URL.');
        return;
    }

    if (resendLink.getAttribute('data-sent') === 'true') {
        return; // Prevent multiple clicks
    }

    resendLink.setAttribute('data-sent', 'true');
    const originalText = resendLink.textContent;
    resendLink.textContent = 'Sending...';
    
    try {
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/api/auth/resend-verification-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: userEmail,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Activation code resent! Please check your email.');
            // In development mode, if email sending is disabled, show the code
            if (data.dev_verification_code) {
                console.log('Dev mode: Verification code:', data.dev_verification_code);
                alert(`Dev mode - Your verification code is: ${data.dev_verification_code}`);
            }
        } else {
            alert(data.detail || 'Failed to resend code. Please try again.');
        }
    } catch (error) {
        console.error('Error resending code:', error);
        alert('Failed to resend code. Please check your connection and try again.');
    } finally {
        resendLink.setAttribute('data-sent', 'false');
        resendLink.textContent = originalText;
    }
});

// Send activation code when page loads (if email is provided)
async function sendInitialActivationCode() {
    if (!userEmail) {
        console.warn('No email provided in URL. Skipping initial code send.');
        return;
    }

    try {
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/api/auth/resend-verification-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: userEmail,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            if (data.email_sent) {
                console.log('✅ Activation code sent successfully to', userEmail);
            } else if (data.email_error) {
                console.warn('⚠️ Failed to send email:', data.email_error);
                if (data.dev_verification_code) {
                    console.log('Dev mode: Verification code:', data.dev_verification_code);
                }
            } else if (data.dev_verification_code) {
                console.log('📧 Dev mode: Email sending disabled. Verification code:', data.dev_verification_code);
            } else {
                console.log('✅ Activation code sent successfully');
            }
        } else {
            console.warn('Failed to send activation code:', data.detail);
        }
    } catch (error) {
        console.error('Error sending initial activation code:', error);
        // Don't show alert on page load, just log the error
    }
}

// Focus first input on load and send initial code
window.addEventListener('load', async () => {
    if (fields[0]) {
        fields[0].focus();
    }
    // Send the activation code when the page loads
    await sendInitialActivationCode();
});

