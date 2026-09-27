"""College enrollment and group-quarters population by tract (ACS 2020-24 5-yr, Census Reporter).
B14007017 = enrolled in college, undergraduate years; B14007018 = graduate or professional school;
B14007001 = population 3 years and over; B26001001 = group quarters population.
Proportion MOE uses the Census derived-proportion formula (ratio formula if the radicand is negative).
Input: acs_enroll_tr.json  Output: allegheny_tract_college_enrollment.csv"""
import csv, json, math

def prop_moe(num, num_moe, den, den_moe):
    p = num / den
    x = num_moe ** 2 - p ** 2 * den_moe ** 2
    if x < 0:
        x = num_moe ** 2 + p ** 2 * den_moe ** 2
    return math.sqrt(x) / den

out = []
for geo, t in json.load(open("acs_enroll_tr.json"))["data"].items():
    e, m = t["B14007"]["estimate"], t["B14007"]["error"]
    pop, pop_m = e["B14007001"], m["B14007001"]
    col = (e["B14007017"] or 0) + (e["B14007018"] or 0)
    col_m = math.sqrt((m["B14007017"] or 0) ** 2 + (m["B14007018"] or 0) ** 2)
    out.append({
        "tract": geo.replace("14000US", ""), "pop_3plus": pop, "pop_3plus_moe": pop_m,
        "enrolled_college": col, "enrolled_college_moe": round(col_m),
        "enrolled_undergrad": e["B14007017"], "enrolled_grad_prof": e["B14007018"],
        "pct_enrolled_college": round(col / pop, 4) if pop else None,
        "pct_enrolled_college_moe": round(prop_moe(col, col_m, pop, pop_m), 4) if pop else None,
        "gq_pop": t["B26001"]["estimate"]["B26001001"], "gq_pop_moe": t["B26001"]["error"]["B26001001"],
    })
    gq = out[-1]["gq_pop"] or 0
    hh_pop = pop - gq
    # Approximation: assumes group-quarters residents are college students (true for dorm tracts,
    # not for nursing homes or prisons, where it understates student households).
    out[-1]["pct_college_outside_gq_approx"] = round(max(col - gq, 0) / hh_pop, 4) if hh_pop > 0 else None
with open("allegheny_tract_college_enrollment.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(out[0]))
    w.writeheader()
    w.writerows(out)
hi = sorted((o for o in out if o["pct_enrolled_college"] is not None), key=lambda o: -o["pct_enrolled_college"])
print(len(out), "tracts; >30% enrolled:", sum(1 for o in out if (o["pct_enrolled_college"] or 0) > 0.30),
      "; >50%:", sum(1 for o in out if (o["pct_enrolled_college"] or 0) > 0.50), "; pop=0:", sum(1 for o in out if not o["pop_3plus"]))
print("county college enrolled", sum(o["enrolled_college"] for o in out), "gq", sum(o["gq_pop"] or 0 for o in out))
print(">30% outside-GQ approx:", sum(1 for o in out if (o["pct_college_outside_gq_approx"] or 0) > 0.30))
print("top 10", [(o["tract"], o["pop_3plus"], o["pct_enrolled_college"], o["pct_enrolled_college_moe"], o["gq_pop"]) for o in hi[:10]])
