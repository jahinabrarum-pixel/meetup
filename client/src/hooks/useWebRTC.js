import React, { useCallback, useEffect, useRef, useState } from "react";
import { dummyRemoteParticipants } from "../assets/asset";
import toast from "react-hot-toast";

const useWebRTC = (_roomId, user, onMeetingEnded, _enabled = true) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteUsers, setRemoteUsers] = useState(dummyRemoteParticipants);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);

    const localStreamRef = useRef(null);

    // Initialize local camera stream if available in browser
    const initLocalStream = useCallback(async () => {
        try {
            if (navigator?.mediaDevices?.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                localStreamRef.current = stream;
                setLocalStream(stream);
                return stream;
            }
        } catch (_error) {
            console.log("Mock WebRTC: Running in camera preview fallback mode");
        }
        return null;
    }, []);

    useEffect(() => {
        initLocalStream();

        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, [initLocalStream]);

    // Toggle local mic
    const toggleAudio = () => {
        const newState = !audioEnabled;
        setAudioEnabled(newState);
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) audioTrack.enabled = newState;
        }
        toast(newState ? "Microphone turned on" : "Microphone muted", {
            icon: newState ? "🎙️" : "🔇",
        });
    };

    // Toggle local camera
    const toggleVideo = () => {
        const newState = !videoEnabled;
        setVideoEnabled(newState);
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) videoTrack.enabled = newState;
        }
        toast(newState ? "Camera turned on" : "Camera turned off", {
            icon: newState ? "📹" : "📷",
        });
    };

    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const toggleScreenShare = useCallback(async () => {
        // যদি screen sharing already চলছে → বন্ধ করবে
        if (isScreenSharing) {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
            }

            setLocalStream(null);
            setIsScreenSharing(false);

            return;
        }

        // Screen sharing চালু
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });

            localStreamRef.current = screenStream;
            setLocalStream(screenStream);
            setIsScreenSharing(true);

            // Browser-এর "Stop sharing" চাপলেও state update হবে
            const videoTrack = screenStream.getVideoTracks()[0];

            if (videoTrack) {
                videoTrack.onended = () => {
                    setIsScreenSharing(false);
                    setLocalStream(null);
                    localStreamRef.current = null;
                };
            }
        } catch (error) {
            console.error("Screen share error:", error);
        }
    }, [isScreenSharing]);

    // End meeting for everyone
    const endMeeting = useCallback(() => {
        if (onMeetingEnded) {
            onMeetingEnded("Meeting ended");
        }
    }, [onMeetingEnded]);

    return {
        localStream,
        remoteUsers,
        audioEnabled,
        videoEnabled,
        toggleAudio,
        toggleVideo,
        endMeeting,
        toggleScreenShare,
        isScreenSharing,
    };
};

export default useWebRTC;
