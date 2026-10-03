package chat

import (
	"encoding/json"
	"net/http"
)

// RoomModel defines a 3D model available for rooms
type RoomModel struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	MaxCapacity int    `json:"max_capacity"`
}

// AvailableRoomModels is the master list of all 3D models the frontend can request
var AvailableRoomModels = []RoomModel{
	{ID: "CLUSTER", Name: "Cluster Kewan", MaxCapacity: 3},
}

// ModelCapacities is used for quick capacity lookups during CreateRoom
var ModelCapacities map[string]int

func init() {
	ModelCapacities = make(map[string]int)
	for _, m := range AvailableRoomModels {
		ModelCapacities[m.ID] = m.MaxCapacity
	}
}

// GetAvailableModels returns the list of models so the frontend can populate a dropdown
func GetAvailableModels() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(AvailableRoomModels)
	}
}
