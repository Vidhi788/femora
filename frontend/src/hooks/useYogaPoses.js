import { useState, useEffect } from "react";
import { fetchPoses } from "../api/yogaApi";

export function useYogaPoses(category) {
  const [poses, setPoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(function () {
    fetchPoses(category)
      .then(function (data) {
        setPoses(data);
        setLoading(false);
      })
      .catch(function () {
        setError("Could not load poses. Is the backend running?");
        setLoading(false);
      });
  }, [category]);

  return { poses: poses, loading: loading, error: error };
}

// keep only poses of one chakra ("" means all)
export function filterByChakra(poses, chakra) {
  if (!chakra) return poses;
  const out = [];
  for (let i = 0; i < poses.length; i++) {
    if (poses[i].chakra === chakra) out.push(poses[i]);
  }
  return out;
}

export function splitSteps(text) {
  return text ? text.split("|") : [];
}