/**
 * `/api` altındaki route handler'ların (bkz. app/api/README.md) kullandığı
 * ortak response zarfı (envelope). Feature'a özel response tipleri bu union'ı
 * temel alır — bkz. proje kuralları §7.3.
 */
export type ApiSuccessResponse<TData> = {
  readonly success: true;
  readonly data: TData;
};

export type ApiErrorResponse = {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
};

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;
