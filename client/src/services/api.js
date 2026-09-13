const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/*
|--------------------------------------------------------------------------
| Get authentication token
|--------------------------------------------------------------------------
*/

function getToken() {
  return localStorage.getItem("ocms_token");
}

/*
|--------------------------------------------------------------------------
| Common API request function
|--------------------------------------------------------------------------
*/

export async function api(path, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      "Unable to connect to the OCMS server. Make sure the backend is running."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Read response
  |--------------------------------------------------------------------------
  */

  const contentType = response.headers.get("content-type") || "";

  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();

    data = text
      ? { message: text }
      : {};
  }

  /*
  |--------------------------------------------------------------------------
  | Handle authentication failure
  |--------------------------------------------------------------------------
  */

  if (response.status === 401) {
    localStorage.removeItem("ocms_token");
    localStorage.removeItem("ocms_user");

    throw new Error(
      data.message || "Your session has expired. Please login again."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Handle API errors
  |--------------------------------------------------------------------------
  */

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
*/

export function get(path) {
  return api(path, {
    method: "GET",
  });
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
*/

export function post(path, body) {
  return api(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/*
|--------------------------------------------------------------------------
| PUT
|--------------------------------------------------------------------------
*/

export function put(path, body) {
  return api(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/*
|--------------------------------------------------------------------------
| PATCH
|--------------------------------------------------------------------------
*/

export function patch(path, body) {
  return api(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

export function remove(path) {
  return api(path, {
    method: "DELETE",
  });
}

/*
|--------------------------------------------------------------------------
| Export API configuration
|--------------------------------------------------------------------------
*/

export { API_URL };