import joblib
import pandas as pd

MODEL_PATH = "models/ovasense_final_model.joblib"
THRESHOLD = 0.38

model = joblib.load(MODEL_PATH)

# Derive expected feature names dynamically from the trained model pipeline
if hasattr(model, "feature_names_in_"):
    EXPECTED_COLUMNS = list(model.feature_names_in_)
elif "preprocessor" in model.named_steps and hasattr(model.named_steps["preprocessor"], "feature_names_in_"):
    EXPECTED_COLUMNS = list(model.named_steps["preprocessor"].feature_names_in_)
else:
    EXPECTED_COLUMNS = []
    if "preprocessor" in model.named_steps:
        for _, _, cols in model.named_steps["preprocessor"].transformers_:
            if isinstance(cols, list):
                EXPECTED_COLUMNS.extend(cols)

print("=" * 60)
print("              OVASENSE MODEL TESTER")
print("=" * 60)
print()
print("Enter patient information.")
print("This is a MODEL TEST only — not a medical diagnosis.")
print()


def ask(prompt):
    return input(prompt).strip()


def ask_float(prompt, min_value=None, min_exclusive=False):
    while True:
        try:
            val = float(input(prompt).strip())
            if min_value is not None:
                if min_exclusive and val <= min_value:
                    print(f"Please enter a value greater than {min_value}.")
                    continue
                if not min_exclusive and val < min_value:
                    print(f"Please enter a value greater than or equal to {min_value}.")
                    continue
            return val
        except ValueError:
            print("Please enter a valid number.")


def ask_binary(prompt):
    while True:
        value = input(prompt + " (Y/N): ").strip().upper()

        if value in ["Y", "YES"]:
            return 1
        if value in ["N", "NO"]:
            return 0

        print("Please enter Y or N.")


def ask_cycle(prompt):
    while True:
        value = input(prompt).strip().upper()
        if value in ["R", "REGULAR"]:
            return 2
        if value in ["I", "IRREGULAR"]:
            return 4
        print("Please enter R for Regular or I for Irregular.")


# ---------------------------------------------------------
# Collect patient features
# ---------------------------------------------------------

age = ask_float("Age (years): ", min_value=0, min_exclusive=True)
weight_kg = ask_float("Weight (kg): ", min_value=0, min_exclusive=True)
height_cm = ask_float("Height (cm): ", min_value=0, min_exclusive=True)

# Automatic BMI Calculation
height_m = height_cm / 100.0
bmi = round(weight_kg / (height_m ** 2), 1)

print()
print(f"Calculated BMI: {bmi:.1f}")
print()

cycle_length = ask_float("Cycle length (days): ", min_value=0, min_exclusive=True)
marriage_status = ask_float("Marriage duration (years): ", min_value=0)
abortions = ask_float("Number of abortions: ", min_value=0)

pregnant = ask_binary("Currently pregnant")
weight_gain = ask_binary("Recent weight gain")
hair_growth = ask_binary("Excess hair growth")
skin_darkening = ask_binary("Skin darkening")
hair_loss = ask_binary("Hair loss")
pimples = ask_binary("Pimples/acne")
fast_food = ask_binary("Frequent fast food")
reg_exercise = ask_binary("Regular exercise")

cycle_ri = ask_cycle("Menstrual cycle (R=Regular / I=Irregular): ")

data = {
    " Age (yrs)": age,
    "Weight (Kg)": weight_kg,
    "Height(Cm) ": height_cm,
    "BMI": bmi,
    "Cycle length(days)": cycle_length,
    "Marraige Status (Yrs)": marriage_status,
    "No. of aborptions": abortions,

    "Pregnant(Y/N)": pregnant,
    "Weight gain(Y/N)": weight_gain,
    "hair growth(Y/N)": hair_growth,
    "Skin darkening (Y/N)": skin_darkening,
    "Hair loss(Y/N)": hair_loss,
    "Pimples(Y/N)": pimples,
    "Fast food (Y/N)": fast_food,
    "Reg.Exercise(Y/N)": reg_exercise,

    "Cycle(R/I)": cycle_ri
}


# ---------------------------------------------------------
# Create DataFrame & Validate Features
# ---------------------------------------------------------

X = pd.DataFrame([data])

# Robust feature validation before prediction
if EXPECTED_COLUMNS:
    missing_cols = set(EXPECTED_COLUMNS) - set(X.columns)
    unexpected_cols = set(X.columns) - set(EXPECTED_COLUMNS)
    if missing_cols or unexpected_cols:
        error_msg = ["Feature validation failed:"]
        if missing_cols:
            error_msg.append(f"  Missing required features: {sorted(missing_cols)}")
        if unexpected_cols:
            error_msg.append(f"  Unexpected features: {sorted(unexpected_cols)}")
        error_msg.append(f"  Expected columns ({len(EXPECTED_COLUMNS)}): {EXPECTED_COLUMNS}")
        error_msg.append(f"  Provided columns ({len(X.columns)}): {X.columns.tolist()}")
        raise ValueError("\n".join(error_msg))
    
    # Align column order with model expectations
    X = X[EXPECTED_COLUMNS]


# ---------------------------------------------------------
# Prediction
# ---------------------------------------------------------

probability = model.predict_proba(X)[0, 1]

prediction = int(probability >= THRESHOLD)


# ---------------------------------------------------------
# Risk category
# ---------------------------------------------------------

if probability < 0.20:
    category = "Lower screening risk"
elif probability < THRESHOLD:
    category = "Intermediate screening risk"
else:
    category = "Higher screening risk"


# ---------------------------------------------------------
# Display result
# ---------------------------------------------------------

print()
print("=" * 60)
print("                    RESULT")
print("=" * 60)

print(f"PCOS Risk Probability : {probability:.2%}")
print(f"Screening Threshold   : {THRESHOLD:.2f}")
print(f"Risk Category         : {category}")

if prediction == 1:
    print()
    print("SCREENING RESULT: HIGHER RISK")
    print("The model recommends further clinical evaluation.")
else:
    print()
    print("SCREENING RESULT: LOWER RISK")
    print("The model did not cross the screening threshold.")

print()
print("-" * 60)
print("IMPORTANT")
print("-" * 60)
print("OvaSense is a screening tool, not a diagnostic system.")
print("It does not confirm or rule out PCOS.")
print("Clinical evaluation should be performed by a qualified")
print("healthcare professional when appropriate.")
print("=" * 60)