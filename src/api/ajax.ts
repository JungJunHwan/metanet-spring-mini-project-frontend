// src/api/ajax.ts
// 순수 XMLHttpRequest(XHR) 기반의 AJAX 통신 유틸리티
// 요구사항 충족을 위해 axios 라이브러리 대신 사용

interface AjaxOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  signal?: AbortSignal;
}

export const ajax = {
  request<T = any>(url: string, options: AjaxOptions = {}): Promise<{ data: T }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const method = options.method || 'GET';

      let requestUrl = url;
      // 파라미터가 있을 경우 URLSearchParams로 쿼리 스트링 구성
      if (options.params) {
        const query = new URLSearchParams();
        Object.entries(options.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query.append(key, String(value));
          }
        });
        const qs = query.toString();
        if (qs) requestUrl += `?${qs}`;
      }

      xhr.open(method, requestUrl, true);

      // AbortSignal 처리 로직
      const onAbort = () => {
        const err = new Error('canceled') as any;
        err.name = 'AbortError';
        err.code = 'ERR_CANCELED';
        reject(err);
        xhr.abort();
      };

      if (options.signal) {
        if (options.signal.aborted) {
          return onAbort();
        }
        options.signal.addEventListener('abort', onAbort);
      }
      
      const cleanup = () => {
        if (options.signal) {
          options.signal.removeEventListener('abort', onAbort);
        }
      };

      // JWT 인증 토큰 자동 주입 (인터셉터 역할)
      // 외부 도메인(GitHub GeoJSON 등)에는 Authorization 헤더를 보내지 않아 CORS Preflight 에러 방지
      const token = localStorage.getItem('token');
      const isExternal = requestUrl.startsWith('http') && !requestUrl.includes('localhost') && !requestUrl.includes('127.0.0.1');
      if (token && !isExternal) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      // Header 설정 및 FormData 여부 체크
      const isFormData = options.data instanceof FormData;
      let contentTypeSet = false;

      if (options.headers) {
        Object.entries(options.headers).forEach(([k, v]) => {
          if (k.toLowerCase() === 'content-type') {
            // FormData인 경우 브라우저가 자동 생성하는 boundary를 보존하기 위해 수동 Content-Type 설정을 차단
            if (!isFormData) {
              xhr.setRequestHeader(k, v);
              contentTypeSet = true;
            }
          } else {
            xhr.setRequestHeader(k, v);
          }
        });
      }

      // 기본 Content-Type 설정 (데이터가 있는 경우 & FormData가 아닌 경우에 한함)
      if (!contentTypeSet && !isFormData && options.data) {
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
      }

      // 응답 처리 라우팅
      xhr.onload = () => {
        // 401/403 응답 시 토큰 삭제 후 로그인으로 이동 (인터셉터 역할)
        if (xhr.status === 401 || xhr.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          window.location.replace('/login');
          return reject(new Error('Unauthorized'));
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          let responseData;
          try {
            responseData = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            if (responseData && typeof responseData === 'object' && 'status' in responseData && 'message' in responseData) {
              responseData = responseData.data;
            }
          } catch (e) {
            responseData = xhr.responseText;
          }
          cleanup();
          resolve({ data: responseData as T });
        } else {
          let errorMessage = `요청 실패 상태코드: ${xhr.status}`;
          let errorData = null;
          try {
            errorData = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            if (errorData && typeof errorData === 'object' && errorData.message) {
              errorMessage = errorData.message;
            }
          } catch(e) {}
          
          const err = new Error(errorMessage) as any;
          err.response = { data: errorData || errorMessage };
          cleanup();
          reject(err);
        }
      };

      xhr.onerror = () => {
        cleanup();
        reject(new Error('네트워크 접속 에러 혹은 AJAX 크로스 오리진 제한'));
      };
      
      xhr.onabort = () => {
        cleanup();
        const err = new Error('canceled') as any;
        err.name = 'AbortError';
        err.code = 'ERR_CANCELED';
        reject(err);
      };

      // Payload 구성 후 발송
      let body = null;
      if (options.data) {
        body = isFormData ? options.data : JSON.stringify(options.data);
      }

      xhr.send(body);
    });
  },

  get<T = any>(url: string, options?: Omit<AjaxOptions, 'method'>) {
    return this.request<T>(url, { ...options, method: 'GET' });
  },
  post<T = any>(url: string, data?: any, options?: Omit<AjaxOptions, 'method' | 'data'>) {
    return this.request<T>(url, { ...options, method: 'POST', data });
  },
  patch<T = any>(url: string, data?: any, options?: Omit<AjaxOptions, 'method' | 'data'>) {
    return this.request<T>(url, { ...options, method: 'PATCH', data });
  },
  delete<T = any>(url: string, options?: Omit<AjaxOptions, 'method'>) {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
};
