const API_BASE_URL = 'http://linkvaultapi.runasp.net/api';

class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

const api = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };

        const token = localStorage.getItem('lv_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                // Global 401 handler
                localStorage.removeItem('lv_token');
                window.location.href = 'login.html';
                throw new ApiError('Unauthorized', 401);
            }

            if (response.status === 204) {
                return null; // No content
            }

            // Sometimes the API might return empty text for 200 OK without JSON
            const text = await response.text();
            let data = null;
            if (text) {
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    data = text; // If not JSON, return as text
                }
            }

            if (!response.ok) {
                let errorMessage = 'An error occurred';
                if (data && typeof data === 'object') {
                     // Try to extract useful error message from standard ASP.NET Core validation responses
                    if (data.title) errorMessage = data.title;
                    if (data.errors) {
                        const errorValues = Object.values(data.errors).flat();
                        if (errorValues.length > 0) {
                            errorMessage = errorValues[0];
                        }
                    }
                    if (data.message) errorMessage = data.message;
                } else if (typeof data === 'string') {
                    errorMessage = data;
                }
                throw new ApiError(errorMessage, response.status, data);
            }

            return data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error(`Network Error: ${error.message}`);
        }
    },

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, body) {
        return this.request(endpoint, { method: 'POST', body });
    },

    put(endpoint, body) {
        return this.request(endpoint, { method: 'PUT', body });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
    
    patch(endpoint, body) {
        return this.request(endpoint, { method: 'PATCH', body });
    }
};
