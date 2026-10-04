package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/yafyx/baak-api/models"
	"github.com/yafyx/baak-api/utils"
)

var (
	utsCache      = make(map[string][]models.UTS)
	utsCacheTime  = make(map[string]time.Time)
	utsCacheMutex sync.RWMutex
	utsCacheTTL   = 2 * time.Hour
)

func HandlerUTS(w http.ResponseWriter, r *http.Request) {
	search := strings.TrimPrefix(r.URL.Path, "/uts/")
	if search == "" {
		http.Error(w, "Missing search term in URL", http.StatusBadRequest)
		return
	}

	search = strings.ToLower(search)

	// Check cache
	utsCacheMutex.RLock()
	cachedData, exists := utsCache[search]
	cacheTime := utsCacheTime[search]
	utsCacheMutex.RUnlock()

	if exists && time.Since(cacheTime) < utsCacheTTL {
		utils.WriteJSONResponse(w, cachedData)
		return
	}

	url := fmt.Sprintf("%s/jadwal/cariUts?&teks=%s", utils.BaseURL, search)
	uts, err := utils.GetUTS(url)
	if err != nil {
		if exists {
			utils.WriteJSONResponse(w, cachedData)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Update cache
	utsCacheMutex.Lock()
	utsCache[search] = uts
	utsCacheTime[search] = time.Now()
	utsCacheMutex.Unlock()

	utils.WriteJSONResponse(w, uts)
}