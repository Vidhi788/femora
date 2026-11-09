package com.femora.backend.symptom;

/** A problem the user can fix. The controller turns it into an HTTP error with a message. */
public class CheckException extends RuntimeException {

    private final int status;

    public CheckException(int status, String message) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}