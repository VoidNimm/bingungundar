package handlers

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/yafyx/baak-api/config"
	"github.com/yafyx/baak-api/models"
	"github.com/yafyx/baak-api/utils"
)

var (
	// In-memory cache for schedule data
	jadwalCache      = make(map[string]models.Jadwal)
	jadwalCacheTime  = make(map[string]time.Time)
	jadwalCacheMutex sync.RWMutex
	cacheDuration    = 12 * time.Hour
)

func HandlerJadwal(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	search := strings.TrimPrefix(r.URL.Path, "/jadwal/")
	if search == "" {
		utils.WriteValidationError(w, "Missing kelas in URL")
		return
	}

	// Validate input
	if len(search) < 3 {
		utils.WriteValidationError(w, "Kelas must be at least 3 characters long")
		return
	}

	// --- 1. CHECK CACHE FIRST ---
	jadwalCacheMutex.RLock()
	cachedJadwal, exists := jadwalCache[search]
	cacheTime := jadwalCacheTime[search]
	jadwalCacheMutex.RUnlock()

	// If cache exists and is fresh, return it immediately (0 seconds)
	if exists && time.Since(cacheTime) < cacheDuration {
		response := struct {
			Kelas  string        `json:"kelas"`
			Jadwal models.Jadwal `json:"jadwal"`
			Cached bool          `json:"cached"`
		}{
			Kelas:  search,
			Jadwal: cachedJadwal,
			Cached: true,
		}
		utils.WriteJSONResponse(w, response)
		return
	}
	// -----------------------------

	// Fetch CSRF token from the base jadwal page
	jadwalBaseURL := fmt.Sprintf("%s/jadwal/cariJadKul", config.AppConfig.BaseURL)
	token, err := utils.GetCSRFToken(jadwalBaseURL)
	if err != nil {
		utils.WriteErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get CSRF token: %v", err))
		return
	}

	// Construct the search URL with the token
	searchURL := fmt.Sprintf("%s/jadwal/cariJadKul?_token=%s&teks=%s",
		config.AppConfig.BaseURL,
		url.QueryEscape(token),
		url.QueryEscape(search),
	)

	jadwal, err := utils.GetJadwal(searchURL)
	if err != nil {
		utils.WriteHTTPError(w, err)
		return
	}

	// --- 2. SAVE TO CACHE ---
	jadwalCacheMutex.Lock()
	jadwalCache[search] = jadwal
	jadwalCacheTime[search] = time.Now()
	jadwalCacheMutex.Unlock()
	// ------------------------

	response := struct {
		Kelas  string        `json:"kelas"`
		Jadwal models.Jadwal `json:"jadwal"`
		Cached bool          `json:"cached"`
	}{
		Kelas:  search,
		Jadwal: jadwal,
		Cached: false,
	}

	utils.WriteJSONResponse(w, response)
}

func HandlerJadwalSearch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	search := r.URL.Query().Get("q")
	if search == "" {
		utils.WriteValidationError(w, "Missing search query parameter 'q'")
		return
	}

	// Validate input
	if len(search) < 3 {
		utils.WriteValidationError(w, "Search query must be at least 3 characters long")
		return
	}

	// Fetch CSRF token from the base jadwal page
	jadwalBaseURL := fmt.Sprintf("%s/jadwal/cariJadKul", config.AppConfig.BaseURL)
	token, err := utils.GetCSRFToken(jadwalBaseURL)
	if err != nil {
		utils.WriteErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get CSRF token: %v", err))
		return
	}

	// Construct the search URL with the token
	searchURL := fmt.Sprintf("%s/jadwal/cariJadKul?_token=%s&teks=%s",
		config.AppConfig.BaseURL,
		url.QueryEscape(token),
		url.QueryEscape(search),
	)

	jadwal, err := utils.GetJadwal(searchURL)
	if err != nil {
		utils.WriteHTTPError(w, err)
		return
	}

	response := struct {
		Query  string        `json:"query"`
		Jadwal models.Jadwal `json:"jadwal"`
	}{
		Query:  search,
		Jadwal: jadwal,
	}

	utils.WriteJSONResponse(w, response)
}
