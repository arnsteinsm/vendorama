// src/services/BringApiService.ts

import type { BringAPIResponse } from "@/types";
import { makeAPIRequest } from "@/utils/apiClient";

class BringApiService {
	private apiKey: string;
	private apiUid: string;
	private baseUrl = "https://api.bring.com/address/api/no/postal-codes/";

	constructor(apiKey: string, apiUid: string) {
		this.apiKey = apiKey;
		this.apiUid = apiUid;
	}

	async fetchPostalData(postalCode: string): Promise<BringAPIResponse> {
		const url = `${this.baseUrl}${postalCode}`;
		const headers = {
			"X-Mybring-API-Uid": this.apiUid,
			"X-Mybring-API-Key": this.apiKey,
		};
		return makeAPIRequest(url, { headers });
	}
}

export default BringApiService;
