// Copyright 2018 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"github.com/tidwall/gjson"
	"io/ioutil"
	"log"
	"net/http"
	"os/exec"
	"time"
)

func main() {
	//These are in requests per second
	var targetLow float64 = 10
	var targetHigh float64 = 15
	// This is for the ticker in milliseconds
	ticker := time.NewTicker(1000 * time.Millisecond)

	isBurst := false

	// Our prometheus query
	reqQuery := `/api/v1/query?query=sum(rate(istio_requests_total{reporter="destination",destination_service="worker-service.default.svc.cluster.local",source_workload="frontend-deployment"}[15s]))by(source_workload,source_app,destination_service)`

	for t := range ticker.C {
		log.Printf("Checking Prometheus at %v", t)

		// Check prometheus
		// Note that b/c we are querying over the past 5 minutes, we are getting a very SLOW ramp of our reqs/second
		// If we wanted this to be a little "snappier" we can scale it down to say 30s
		resp, err := http.Get("http://prometheus.istio-system.svc.cluster.local:9090" + reqQuery)
		if err != nil {
			log.Printf("Error: %v", err)
			continue
		}
		defer resp.Body.Close()
		body, _ := ioutil.ReadAll(resp.Body)

		val := gjson.Get(string(body), "data.result.0.value.1")
		log.Printf("Value: %v", val)

		currentReqPerSecond := val.Float()
		log.Printf("Reqs per second %f", currentReqPerSecond)

		if currentReqPerSecond > targetHigh && !isBurst {
			applyIstio("burst.yaml")
			log.Println("Entering burst mode")
			isBurst = true
		} else if currentReqPerSecond < targetLow && isBurst {
			applyIstio("natural.yaml")
			log.Println("Returning to natural state.")
			isBurst = false
		}
	}
}

func applyIstio(filename string) {
	cmd := exec.Command("istioctl", "replace", "-f", filename)
	if err := cmd.Run(); err != nil {
		log.Printf("Error hit applying istio manifests: %v", err)
	}
}